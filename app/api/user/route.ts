import connectMongoDB from "@/lib/db_connect";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    await connectMongoDB();
    const { name, email, password } = await request.json();
    const exists = await User.findOne({ email });
    if (exists) {
      return NextResponse.json(
        { message: "هذا الحساب أو اسم المستخدم موجود بالفعل" },
        { status: 400 }
      );
    }
    if (!email) {
      throw new Error("من فضلك ادخل الايميل");
    }
    if (!password) {
      throw new Error("من فضلك ادخل كلمة السر");
    }
    if (!name) {
      throw new Error("من فضلك ادخل الاسم ");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    if (!hashedPassword) {
      throw new Error("حدث خطا ما في كلمة السر");
    }
    const Data = await User.create({ name, email, password: hashedPassword });
    return NextResponse.json(
      { success: true, error: false, message: "تم تسجيل الحساب", data: Data },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "لم يتم تسجيل الحساب." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectMongoDB();
    const users = await User.find();
    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json(
      { message: "Error fetching users." },
      { status: 500 }
    );
  }
}

