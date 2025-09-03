/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/api/clients/route.ts
import dbConnect from '@/lib/dbConnect';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // تأكد من المسار الصحيح لـ authOptions
import Client from '@/models/Client';
import Case from '@/models/Case';
interface MongoError {
  name?: string;
  errors?: Record<string, { message: string }>;
  message?: string;
}
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}
// دالة لجلب كل الموكلين للمحامي الحالي

// هذا الـ endpoint الجديد يقوم بجلب جميع الموكلين مع عدد قضاياهم
export async function GET(req: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, message: "غير مصرح لك بالوصول" },
        { status: 401 }
      );
    }

    const lawyerId = session.user.id;
    const clients = await Client.aggregate([
      { $match: { owner: new (require('mongoose').Types.ObjectId)(lawyerId) } }, // تأكد من تحويل lawyerId إلى ObjectId
      {
        $lookup: {
          from: "cases", // اسم مجموعة القضايا في قاعدة البيانات
          localField: "_id",
          foreignField: "client",
          as: "cases"
        },
      },
      { $addFields: { caseCount: { $size: "$cases" } } },
    ])
    return NextResponse.json({ success: true, data: clients }, { status: 200 });
  } catch (error) {
    console.error('Error Getting Client:', error);

    // يمكن حذف هذه الجزئية إذا لم تعد تستخدم، أو الاحتفاظ بها لمعالجة الأخطاء
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mongoError = error as any; // استخدام any لتجنب مشاكل النوع
    if (mongoError.name === 'ValidationError' && mongoError.errors) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const messages = Object.values(mongoError.errors).map((val: any) => val.message);
      return NextResponse.json({ success: false, message: messages.join(', ') }, { status: 400 });
    }

    // دالة getErrorMessage غير موجودة، يمكن استبدالها برسالة خطأ عامة
    return NextResponse.json({ success: false, message: "فشل في جلب الموكلين: حدث خطأ غير متوقع في الخادم" }, { status: 500 });
  }
}

// دالة لإنشاء موكل جديد
export async function POST(req: Request) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ success: false, message: 'Authentication required.' }, { status: 401 });
  }

  const lawyerId = session.user.id;

  try {
    const body = await req.json();
    const { name, email, phone, address } = body;
    const existingClient = await Client.findOne({ name: body.name, owner: lawyerId });
    if (existingClient) {
      return NextResponse.json({ success: false, message: 'هذا الموكل موجود بالفعل.' }, { status: 400 });
    }
    // التحقق من الحقول المطلوبة
    if (!name) {
      return NextResponse.json({ success: false, message: 'اسم الموكل مطلوب.' }, { status: 400 });
    }

    const newClient = await Client.create({
      name,
      email: email || '',
      phone: phone || '',
      address: address || '',
      owner: lawyerId, // ربط الموكل بالمحامي الحالي
    });

    return NextResponse.json({ success: true, data: newClient }, { status: 201 });
  } catch (error) {
    console.error('Error Creating Client:', error);

    // Handle Mongoose validation errors
    const mongoError = error as MongoError;
    if (mongoError.name === 'ValidationError' && mongoError.errors) {
      const messages = Object.values(mongoError.errors).map((val) => val.message);
      return NextResponse.json({ success: false, message: messages.join(', ') }, { status: 400 });
    }

    const errorMessage = getErrorMessage(error);
    return NextResponse.json({ success: false, message: `Failed to Create Client: ${errorMessage}` }, { status: 500 });
  }
}