/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-require-imports */
import dbConnect from '@/lib/dbConnect';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Client from '@/models/Client';
import User from '@/models/User';
import mongoose from 'mongoose';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unknown error occurred';
}

// Helper function to safely extract ObjectId
function safeExtractObjectId(value: any): string | null {
  try {
    if (!value) return null;
    if (typeof value === "string" && mongoose.Types.ObjectId.isValid(value)) {
      return value;
    }
    if (typeof value === "object" && "_id" in value) {
      const idStr = value._id.toString();
      return mongoose.Types.ObjectId.isValid(idStr) ? idStr : null;
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "Authentication required." },
      { status: 401 }
    );
  }

  try {
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      );
    }

    // التحقق من الصلاحيات
    if (user.accountType !== "owner" && !user.permissions?.clients?.view) {
      return NextResponse.json(
        { success: false, message: "ليس لديك صلاحية لعرض العملاء." },
        { status: 403 }
      );
    }

    let ownerId: string;
    if (user.accountType === "owner") {
      ownerId = (user._id as any).toString();
    } else {
      ownerId = user.ownerId?.toString() || "";
    }

    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      return NextResponse.json(
        { success: false, message: "معرف المالك غير صحيح." },
        { status: 400 }
      );
    }

    // الحصول على searchQuery من الـ URL
    const searchQuery = req.nextUrl.searchParams.get("searchQuery");

    // بناء الـ match condition
    const matchCondition: any = {
      owner: new mongoose.Types.ObjectId(ownerId)
    };

    // إضافة البحث بالاسم إذا كان موجود
    if (searchQuery) {
      matchCondition.name = { $regex: searchQuery, $options: "i" };
    }

    // استخدام aggregation للحصول على العملاء مع عدد القضايا
    const clients = await Client.aggregate([
      {
        $match: matchCondition
      },
      {
        $lookup: {
          from: "cases",
          localField: "_id",
          foreignField: "client",
          as: "cases",
        },
      },
      {
        $addFields: {
          caseCount: { $size: "$cases" }
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    return NextResponse.json({
      success: true,
      data: clients
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch clients.", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 }
      );
    }

    console.log("Session user:", JSON.stringify(session.user, null, 2));

    // الحصول على المستخدم من قاعدة البيانات
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      );
    }

    console.log("User from DB:", {
      id: user._id,
      accountType: user.accountType,
      ownerId: user.ownerId,
      permissions: user.permissions?.clients
    });

    // التحقق من الصلاحيات
    if (user.accountType !== "owner" && !user.permissions?.clients?.create) {
      return NextResponse.json(
        { success: false, message: "ليس لديك صلاحية لإنشاء عملاء جدد." },
        { status: 403 }
      );
    }

    // تحديد معرف المالك
    let ownerId: string;
    if (user.accountType === "owner") {
      ownerId = (user._id as any).toString();
    } else if (user.accountType === "employee" && user.ownerId) {
      ownerId = user.ownerId.toString();
    } else {
      console.error("Cannot determine owner ID:", {
        accountType: user.accountType,
        ownerId: user.ownerId
      });
      return NextResponse.json(
        { success: false, message: "لا يمكن تحديد معرف المالك." },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      console.error("Invalid owner ID:", ownerId);
      return NextResponse.json(
        { success: false, message: "معرف المالك غير صحيح." },
        { status: 400 }
      );
    }

    const body = await req.json();
    console.log("Request body:", body);

    const { name, email, phone, address } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: "اسم الموكل مطلوب." },
        { status: 400 }
      );
    }

    // التحقق من عدم وجود عميل بنفس الاسم
    const existingClient = await Client.findOne({
      name: name.trim(),
      owner: new mongoose.Types.ObjectId(ownerId),
    });

    if (existingClient) {
      return NextResponse.json(
        { success: false, message: "هذا الموكل موجود بالفعل." },
        { status: 400 }
      );
    }

    const newClient = await Client.create({
      name: name.trim(),
      email: email?.trim() || "",
      phone: phone?.trim() || "",
      address: address?.trim() || "",
      owner: new mongoose.Types.ObjectId(ownerId),
      createdBy: new mongoose.Types.ObjectId((user._id as any).toString()),
    });

    console.log("Client created successfully:", newClient._id);

    return NextResponse.json({
      success: true,
      data: newClient
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error Creating Client:", error);
    console.error("Error stack:", error.stack);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "فشل في إنشاء الموكل",
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}