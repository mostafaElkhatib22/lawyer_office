/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import nodemailer, { SentMessageInfo } from "nodemailer";

/* ------------------ Helpers ------------------ */

// 🔑 توليد توكن لإعادة التعيين
function generateResetToken() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15) +
    Date.now().toString(36)
  );
}

// 📧 إنشاء transporter (يدعم Gmail و Outlook و أي SMTP)
function createEmailTransporter() {
  // لو محدد Service (gmail, outlook, hotmail...)
  if (process.env.SMTP_SERVICE) {
    return nodemailer.createTransport({
      service: process.env.SMTP_SERVICE,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // لو محدد host + port
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465", // SSL لو 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === "production",
    },
  });
}

// 📧 إرسال الإيميل
async function sendResetEmail(toEmail: string, toName: string, resetUrl: string) {
  const transporter = createEmailTransporter();

  const mailOptions = {
    from: {
      name: process.env.FROM_NAME || "Lawyer Office System",
      address: process.env.FROM_EMAIL || process.env.SMTP_USER!,
    },
    to: {
      name: toName,
      address: toEmail,
    },
    subject: "🔐 إعادة تعيين كلمة المرور - نظام إدارة المكاتب القانونية",
    html: `<p>مرحباً ${toName},</p>
           <p>اضغط على الرابط لإعادة تعيين كلمة المرور:</p>
           <a href="${resetUrl}">${resetUrl}</a>
           <p>الرابط صالح لمدة 10 دقائق فقط.</p>`,
    text: `مرحباً ${toName},\n\nاستخدم الرابط التالي لإعادة تعيين كلمة المرور:\n${resetUrl}\n\nصالح لمدة 10 دقائق فقط.`,
  };

  const info: SentMessageInfo = await transporter.sendMail(mailOptions);

  transporter.close();

  return info;
}

/* ------------------ API Route ------------------ */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ success: false, message: "البريد الإلكتروني مطلوب" }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ success: false,error:true, message: "لا يوجد مستخدم بهذا البريد الإلكتروني" }, { status: 404 });
    }

    // 🔑 إنشاء توكن وإضافته لليوزر
    const resetToken = generateResetToken();
    const salt = bcrypt.genSaltSync(10);
    user.resetPasswordToken = bcrypt.hashSync(resetToken, salt);
    user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;

    // ✉️ إرسال الإيميل
    const info = await sendResetEmail(user.email, user.name, resetUrl);

    return NextResponse.json({
      success: true,
      message: "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.",
      resetUrl, // موجودة كـ fallback في حالة فشل الميل
      emailInfo: {
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
      },
    });
  } catch (error: any) {
    console.error("💥 Server error:", error);
    return NextResponse.json({ success: false, message: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
