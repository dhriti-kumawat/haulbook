import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { clientIp, rateLimit } from "./rateLimit";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Google sign-in is offered only when its keys are configured.
    ...(process.env.GOOGLE_ID && process.env.GOOGLE_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_ID,
            clientSecret: process.env.GOOGLE_SECRET,
            // Google confirms the email, so someone who signed up with a password can also use Google.
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
        if (!rateLimit(`signin-ip:${ip}`, 20, 15 * 60_000) || !rateLimit(`signin-email:${email}`, 8, 15 * 60_000)) {
          throw new Error("Too many attempts. Wait a few minutes and try again.");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("Email or password is incorrect");
        }

        if (!user.password) {
          throw new Error("This account uses Google sign-in. Continue with Google instead.");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Email or password is incorrect");
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
