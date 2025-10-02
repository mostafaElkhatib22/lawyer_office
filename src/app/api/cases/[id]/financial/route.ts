/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/cases/[id]/financial/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Case from "@/models/Case";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { IUser } from "@/types/user";

// GET - جلب المعلومات المالية للدعوى
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const params = await context.params;
  const { id } = params;

  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json(
      { success: false, message: "غير مصرح لك بالوصول" },
      { status: 401 }
    );
  }

  try {
    const user = await User.findById(session.user.id) as IUser | null;
    if (!user) {
      return NextResponse.json(
        { success: false, message: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    const caseDetails = await Case.findById(id).populate("client");
    if (!caseDetails) {
      return NextResponse.json(
        { success: false, message: "الدعوى غير موجودة" },
        { status: 404 }
      );
    }

    // التحقق من الصلاحيات
    if (user.accountType === "owner") {
      if (caseDetails.owner.toString() !== (user._id as any).toString()) {
        return NextResponse.json(
          { success: false, message: "غير مصرح لك بالوصول إلى هذه الدعوى" },
          { status: 403 }
        );
      }
    } else if (user.accountType === "employee") {
      if (!user.permissions?.financial?.viewPayments && !user.permissions?.financial?.viewReports) {
        return NextResponse.json(
          { success: false, message: "ليس لديك صلاحية لعرض البيانات المالية" },
          { status: 403 }
        );
      }
    }

    // إعداد البيانات المالية
    const financialData = {
      fees: caseDetails.financialInfo?.fees || 0,
      paidAmount: caseDetails.financialInfo?.paidAmount || 0,
      remainingAmount: (caseDetails.financialInfo?.fees || 0) - (caseDetails.financialInfo?.paidAmount || 0),
      currency: caseDetails.financialInfo?.currency || 'EGP',
      payments: caseDetails.financialInfo?.payments || [],
      lastPaymentDate: caseDetails.financialInfo?.lastPaymentDate || null,
      financialNotes: caseDetails.financialInfo?.financialNotes || '',
      paymentStatus: caseDetails.getPaymentStatus ? caseDetails.getPaymentStatus() : 'no_fees'
    };

    return NextResponse.json(
      { success: true, data: financialData },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching financial info:", error);
    return NextResponse.json(
      { success: false, message: error.message || "فشل في جلب البيانات المالية" },
      { status: 500 }
    );
  }
}

// PUT - تحديث المعلومات المالية
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const params = await context.params;
  const { id } = params;

  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json(
      { success: false, message: "غير مصرح لك بالتحديث" },
      { status: 401 }
    );
  }

  try {
    const user = await User.findById(session.user.id) as IUser | null;
    if (!user) {
      return NextResponse.json(
        { success: false, message: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    const existingCase = await Case.findById(id);
    if (!existingCase) {
      return NextResponse.json(
        { success: false, message: "الدعوى غير موجودة" },
        { status: 404 }
      );
    }

    // التحقق من الصلاحيات
    if (user.accountType === "owner") {
      if (existingCase.owner.toString() !== (user._id as any).toString()) {
        return NextResponse.json(
          { success: false, message: "غير مصرح لك بتحديث هذه الدعوى" },
          { status: 403 }
        );
      }
    } else if (user.accountType === "employee") {
      if (!user.permissions?.financial?.editPrices) {
        return NextResponse.json(
          { success: false, message: "ليس لديك صلاحية لتعديل البيانات المالية" },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const { fees, currency, financialNotes } = body;

    // تحديث المعلومات المالية
    const updateData: any = {};
    if (fees !== undefined) updateData['financialInfo.fees'] = fees;
    if (currency !== undefined) updateData['financialInfo.currency'] = currency;
    if (financialNotes !== undefined) updateData['financialInfo.financialNotes'] = financialNotes;

    const updatedCase = await Case.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate("client");

    return NextResponse.json(
      { success: true, data: updatedCase, message: "تم تحديث البيانات المالية بنجاح" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating financial info:", error);
    return NextResponse.json(
      { success: false, message: error.message || "فشل في تحديث البيانات المالية" },
      { status: 500 }
    );
  }
}