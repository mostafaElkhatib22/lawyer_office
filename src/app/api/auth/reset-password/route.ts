import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({
        success: false,
        message: 'الرمز وكلمة المرور الجديدة مطلوبان'
      }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({
        success: false,
        message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
      }, { status: 400 });
    }

    await dbConnect();

    // Get all users with reset tokens to find matching one
    const users = await User.find({
      resetPasswordExpire: { $gt: Date.now() }
    }).select('+resetPasswordToken +resetPasswordExpire');

    // Find user with matching token
    let user = null;
    for (const u of users) {
      if (u.resetPasswordToken && bcrypt.compareSync(token, u.resetPasswordToken)) {
        user = u;
        break;
      }
    }

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'الرمز غير صحيح أو منتهي الصلاحية'
      }, { status: 400 });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'تم تحديث كلمة المرور بنجاح'
    }, { status: 200 });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({
      success: false,
      message: 'حدث خطأ في الخادم'
    }, { status: 500 });
  }
}
