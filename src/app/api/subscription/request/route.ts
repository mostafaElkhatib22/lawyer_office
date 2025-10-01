/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/subscription/request/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";

// Schema لطلبات الاشتراك
const SubscriptionRequestSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  planKey: { 
    type: String, 
    required: true 
  },
  planName: { 
    type: String, 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  paymentProof: { 
    type: String // رابط صورة إثبات الدفع
  },
  notes: { 
    type: String 
  },
  approvedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  approvedAt: { 
    type: Date 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const SubscriptionRequest = mongoose.models.SubscriptionRequest || 
  mongoose.model('SubscriptionRequest', SubscriptionRequestSchema);

// POST - إنشاء طلب اشتراك جديد
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "غير مصرح" },
        { status: 401 }
      );
    }

    // التأكد من أنه Owner
    if (session.user.accountType !== 'owner') {
      return NextResponse.json(
        { success: false, message: "هذه الخدمة متاحة لأصحاب المكاتب فقط" },
        { status: 403 }
      );
    }

    await dbConnect();

    const body = await req.json();
    const { planKey, planName, amount } = body;

    if (!planKey || !planName || !amount) {
      return NextResponse.json(
        { success: false, message: "بيانات غير كاملة" },
        { status: 400 }
      );
    }

    // التحقق من عدم وجود طلب معلق
    const existingRequest = await SubscriptionRequest.findOne({
      userId: session.user.id,
      status: 'pending'
    });

    if (existingRequest) {
      return NextResponse.json(
        { 
          success: false, 
          message: "لديك طلب معلق بالفعل. يرجى انتظار الموافقة عليه أولاً" 
        },
        { status: 400 }
      );
    }

    // إنشاء الطلب
    const newRequest = await SubscriptionRequest.create({
      userId: session.user.id,
      planKey,
      planName,
      amount,
      status: 'pending'
    });

    return NextResponse.json({
      success: true,
      message: "تم إرسال طلب الاشتراك بنجاح",
      data: newRequest
    }, { status: 201 });

  } catch (error: any) {
    console.error("خطأ في إنشاء طلب الاشتراك:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}

// GET - الحصول على طلبات المستخدم
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "غير مصرح" },
        { status: 401 }
      );
    }

    await dbConnect();

    const requests = await SubscriptionRequest.find({
      userId: session.user.id
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: requests
    });

  } catch (error: any) {
    console.error("خطأ في جلب الطلبات:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}