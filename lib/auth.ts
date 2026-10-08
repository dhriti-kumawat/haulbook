import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { clientIp, rateLimit } from "./rateLimit";
import { MAX_PASSWORD } from "./passwordReset";

/** A real bcrypt hash of a random string, compared against when an account doesn't exist. */
const DUMMY_HASH = "$2a$12$oFFOTbozDH73d0fgqsoVHufsJ.0POQTsjNkAoT2KXrIt5pPTJzUCu";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Google sign-in is offered only when its keys are configured.
    ...(process.env.GOOGLE_ID && process.env.GOOGLE_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_ID,
            clientSecret: process.env.GOOGLE_SECRET,
            // Google confirms the email, so someone who signed up with a password can also use Google
            // (the linkAccount event below closes the "pre-registered account" takeover).
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Enter your email and password");
        }
        // Slow down password guessing: per address and per account.
        const ip = clientIp((req?.headers ?? {}) as Record<string, string>);
        const email = credentials.email.trim().toLowerCase();
        if (!(await rateLimit(`signin-ip:${ip}`, 20, 15 * 60_000)) || !(await rateLimit(`signin-email:${email}`, 8, 15 * 60_000))) {
          throw new Error("Too many attempts. Wait a few minutes and try again.");
        }

        const user = await prisma.user.findFirst({
          where: { email: { equals: email, mode: "insensitive" } },
        });

        // Same answer and roughly the same time whether or not the account exists,
        // so the sign-in form can't be used to find out who has an account.
        const password = credentials.password.slice(0, MAX_PASSWORD);
        const valid = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);
        if (!user || !user.password || !valid) {
          throw new Error("Email or password is incorrect. If you signed up with Google, use Continue with Google.");
        }

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    // Errors (e.g. Google cancelled) come back to the sign-in page with ?error=…
    error: "/auth/signin",
  },
  callbacks: {
    async signIn({ account, profile }) {
      // Only accept Google accounts whose email Google has verified.
      if (account?.provider === "google") return (profile as { email_verified?: boolean } | undefined)?.email_verified === true;
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        // When this sign-in happened, so sessions from before a password reset can be refused.
        session.issuedAt = typeof token.iat === "number" ? token.iat : 0;
      }
      return session;
    },
  },
  events: {
    // Someone could sign up with another person's email and a password before that person ever
    // uses Haulbook. When the real owner signs in with Google (which proves the email), drop any
    // password nobody verified, so the squatter's password stops working.
    async linkAccount({ user, account }) {
      if (account.provider !== "google") return;
      const existing = await prisma.user.findUnique({ where: { id: user.id } });
      if (existing && !existing.emailVerified) {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date(), ...(existing.password ? { password: null, passwordChangedAt: new Date() } : {}) },
        });
      }
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
