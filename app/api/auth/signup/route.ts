import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { BCRYPT_COST, MAX_PASSWORD, MIN_PASSWORD, isEmail, normalizeEmail } from "@/lib/passwordReset";

export async function POST(req: NextRequest) {
  if (!(await rateLimit(`signup-ip:${clientIp(req.headers)}`, 5, 60 * 60_000))) {
    return NextResponse.json({ error: "Too many sign-ups from this network. Try again later." }, { status: 429 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(body.email);
    const password = body.password;
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) || null : null;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (!isEmail(email)) {
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < MIN_PASSWORD) {
      return NextResponse.json({ error: `Password needs at least ${MIN_PASSWORD} characters` }, { status: 400 });
    }
    if (password.length > MAX_PASSWORD) {
      return NextResponse.json({ error: `Password can be at most ${MAX_PASSWORD} characters` }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists. Sign in instead." },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_COST);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
