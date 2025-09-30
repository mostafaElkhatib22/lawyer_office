/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/subscription/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SUBSCRIPTION_PLANS } from "@/constants/subscriptionPlans";

// GET - الحصول على معلومات الاشتراك الحالي
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

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    // تحديد صاحب المكتب
    const ownerId = user.accountType === "owner" ? user._id : user.ownerId;
    const owner = await User.findById(ownerId);

    if (!owner) {
      return NextResponse.json(
        { success: false, message: "بيانات المكتب غير موجودة" },
        { status: 404 }
      );
    }

    // حساب عدد الدعاوى الحالية
    const Case = (await import("@/models/Case")).default;
    const currentCasesCount = await Case.countDocuments({ owner: ownerId });

    const currentPlan = owner.firmInfo.subscriptionPlan || "free";
    const planDetails =
      SUBSCRIPTION_PLANS[currentPlan as keyof typeof SUBSCRIPTION_PLANS];

    return NextResponse.json({
      success: true,
      data: {
        currentPlan,
        planDetails,
        usage: {
          cases: {
            current: currentCasesCount,
            max: planDetails.maxCases,
            percentage:
              planDetails.maxCases > 0
                ? Math.round((currentCasesCount / planDetails.maxCases) * 100)
                : 0,
            remaining:
              planDetails.maxCases > 0
                ? planDetails.maxCases - currentCasesCount
                : -1,
          },
        },
        subscription: owner.firmInfo.subscription || null,
        availablePlans: SUBSCRIPTION_PLANS,
      },
    });
  } catch (error: any) {
    console.error("خطأ في جلب بيانات الاشتراك:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}

// POST - الاشتراك في باقة جديدة
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "غير مصرح" },
        { status: 401 }
      );
    }

    await dbConnect();

    const user = await User.findById(session.user.id);
    if (!user || user.accountType !== "owner") {
      return NextResponse.json(
        { success: false, message: "فقط صاحب المكتب يمكنه الاشتراك" },
        { status: 403 }
      );
    }

    const { plan, paymentMethod, transactionId } = await req.json();

    if (!SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS]) {
      return NextResponse.json(
        { success: false, message: "الباقة المختارة غير موجودة" },
        { status: 400 }
      );
    }

    const selectedPlan =
      SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS];

    // تحديث بيانات الاشتراك
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1); // سنة واحدة

    user.firmInfo.subscriptionPlan = plan;
    user.firmInfo.maxCases = selectedPlan.maxCases;
    // user.firmInfo.maxEmployees = selectedPlan.maxEmployees;
    user.firmInfo.subscription = {
      isActive: true,
      planName: selectedPlan.name,
      price: selectedPlan.price,
      startDate,
      endDate,
      paymentMethod,
      transactionId,
    };

    await user.save();

    return NextResponse.json({
      success: true,
      message: `تم الاشتراك في ${selectedPlan.name} بنجاح!`,
      data: {
        plan,
        planDetails: selectedPlan,
        subscription: user.firmInfo.subscription,
      },
    });
  } catch (error: any) {
    console.error("خطأ في عملية الاشتراك:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}
