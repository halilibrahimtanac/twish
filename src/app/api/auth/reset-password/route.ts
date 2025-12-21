import db from "@/db";
import { passwordResetTokens, users } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import crypto from "crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";

const resetSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Şifreler aynı olmalı.",
  });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, password } = resetSchema.parse(body);

    const now = new Date();
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const [resetToken] = await db
      .select({
        id: passwordResetTokens.id,
        userId: passwordResetTokens.userId,
        expiresAt: passwordResetTokens.expiresAt,
      })
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          gt(passwordResetTokens.expiresAt, now),
          isNull(passwordResetTokens.usedAt)
        )
      )
      .limit(1);

    if (!resetToken) {
      return NextResponse.json(
        { success: false, message: "Bu bağlantı geçersiz veya süresi dolmuş." },
        { status: 400 }
      );
    }

    const newHashedPassword = await hashPassword(password);

    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ password: newHashedPassword, updatedAt: now })
        .where(eq(users.id, resetToken.userId));

      await tx
        .update(passwordResetTokens)
        .set({ usedAt: now })
        .where(eq(passwordResetTokens.id, resetToken.id));

      await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, resetToken.userId));
    });

    return NextResponse.json({
      success: true,
      message: "Şifreniz güncellendi. Şimdi giriş yapabilirsiniz.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: error.issues[0]?.message || "Geçerli bir şifre girin.",
        },
        { status: 400 }
      );
    }

    console.error(error);
    return NextResponse.json(
      { success: false, message: "Şifre güncellenemedi. Lütfen tekrar deneyin." },
      { status: 500 }
    );
  }
}
