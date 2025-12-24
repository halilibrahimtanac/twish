import db from "@/db";
import { passwordResetTokens, users } from "@/db/schema";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import nodemailer from "nodemailer";

const requestSchema = z.object({
  email: z.string().email(),
});

const RESET_TOKEN_TTL_MS = 3000 * 60 * 60; // 1 hour

function getBaseUrl() {
  const candidate =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.VERCEL_URL;

  if (!candidate) {
    return "http://localhost:3000";
  }

  if (candidate.startsWith("http")) {
    return candidate;
  }

  return `https://${candidate}`;
}

async function sendResetEmail(email: string, resetUrl: string) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.log(`[password-reset] ${email} -> ${resetUrl}`);
    return { delivered: false };
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to: email,
    subject: "Twish | Password reset",
    text: `Şifrenizi yenilemek için bağlantıya tıklayın: ${resetUrl}`,
    html: `<p>Şifrenizi yenilemek için aşağıdaki bağlantıya tıklayın.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  });

  return { delivered: true };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = requestSchema.parse(body);

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return NextResponse.json({
        success: true,
        message:
          "Eğer bu e-posta ile bir hesabımız varsa şifre sıfırlama bağlantısı gönderildi.",
      });
    }

    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await db.insert(passwordResetTokens).values({
      id: crypto.randomUUID(),
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const resetUrl = `${getBaseUrl()}/reset-password?token=${rawToken}`;
    const { delivered } = await sendResetEmail(user.email, resetUrl);

    return NextResponse.json({
      success: true,
      delivered,
      message:
        "Eğer bu e-posta ile bir hesabımız varsa şifre sıfırlama bağlantısı gönderildi.",
      resetUrl: process.env.NODE_ENV === "development" ? resetUrl : undefined,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, message: "Geçerli bir e-posta girin." },
        { status: 400 }
      );
    }

    console.error(error);
    return NextResponse.json(
      { success: false, message: "Şifre sıfırlama isteği oluşturulamadı." },
      { status: 500 }
    );
  }
}
