/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/api/cases/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/cases/route.ts
import dbConnect from "@/lib/dbConnect";
import Case from "@/models/Case";
import Client from "@/models/Client";
import User from "@/models/User"; // 🟢 مهم عشان نجيب بيانات المستخدم
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  console.log(session?.user)
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json(
      { success: false, message: "Authentication required." },
      { status: 401 }
    );
  }

  try {
    // 🟢 نجيب المستخدم من قاعدة البيانات
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      );
    }

    let query: any = {};

    if (user.accountType === "owner") {
      // ✅ صاحب المكتب يشوف كل القضايا اللي تبع المكتب
      query.owner = user._id;
    } else if (user.accountType === "employee") {
      if (user.hasPermission("cases", "viewAll")) {
        // ✅ الموظف اللي عنده صلاحية viewAll يشوف كل القضايا
        query.owner = user.ownerId;
      } else {
        // ✅ الموظف العادي يشوف القضايا الخاصة بيه فقط
        query.owner = user.ownerId;
        query.assignedTo = user._id; // لو عندك في Case field زي assignedTo
      }
    }
    await Client.find(query)
    const cases = await Case.find(query)
      .sort({ createdAt: -1 })
      .populate("client");
    return NextResponse.json({ success: true, data: cases }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching cases:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch cases." },
      { status: 500 }
    );
  }
}
export async function POST(req: Request) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json(
      { success: false, message: "Authentication required." },
      { status: 401 }
    );
  }

  try {
    const currentUser = await User.findById(session.user.id);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      );
    }

    const ownerId =
      currentUser.accountType === "owner"
        ? currentUser._id
        : currentUser.ownerId;

    const owner = await User.findById(ownerId);
    if (!owner) {
      return NextResponse.json(
        { success: false, message: "لم يتم العثور على بيانات المكتب." },
        { status: 404 }
      );
    }

    const currentCasesCount = await Case.countDocuments({
      owner: ownerId,
    });

    if (owner.firmInfo.subscriptionPlan === 'free') {
      const maxCases = owner.firmInfo.maxCases || 50;

      if (currentCasesCount >= maxCases) {
        return NextResponse.json(
          {
            success: false,
            limitReached: true,
            message: `لقد وصلت للحد الأقصى من الدعاوى (${maxCases}) في النسخة التجريبية.`,
            currentCount: currentCasesCount,
            maxAllowed: maxCases,
            upgradeRequired: true
          },
          { status: 403 }
        );
      }
    }

    if (
      currentUser.accountType === "employee" &&
      !currentUser.permissions?.cases?.create
    ) {
      return NextResponse.json(
        { success: false, message: "ليس لديك صلاحية لإضافة دعوى." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      client,
      caseTypeOF,
      type,
      court,
      caseNumber,
      year,
      nameOfCase,
      attorneyNumber,
      decision,
      nots,
      status,
      caseDate,
      sessiondate,
      opponents,
      files,
      assignedTo,
      financialInfo, // 🟢 إضافة البيانات المالية
    } = body;

    if (
      !client ||
      !caseTypeOF ||
      !type ||
      !court ||
      !caseNumber ||
      !year ||
      !attorneyNumber
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please fill all required fields.",
        },
        { status: 400 }
      );
    }

    // 🟢 تجهيز البيانات المالية
    const preparedFinancialInfo = {
      fees: financialInfo?.fees || 0,
      currency: financialInfo?.currency || 'EGP',
      financialNotes: financialInfo?.financialNotes || '',
      paidAmount: financialInfo?.paidAmount || 0,
      payments: (financialInfo?.payments || []).map((payment: any) => ({
        amount: payment.amount || 0,
        date: payment.date ? new Date(payment.date) : new Date(),
        method: payment.method || 'نقدي',
        note: payment.note || ''
      })),
      lastPaymentDate: financialInfo?.payments?.length > 0 
        ? new Date(financialInfo.payments[financialInfo.payments.length - 1].date)
        : null
    };

    const newCase = await Case.create({
      client,
      caseTypeOF,
      type,
      court,
      caseNumber,
      year,
      nameOfCase,
      status,
      attorneyNumber,
      decision: decision || "",
      nots: nots || "",
      caseDate: caseDate ? new Date(caseDate) : new Date(),
      sessiondate: sessiondate ? new Date(sessiondate) : new Date(),
      opponents: opponents || [],
      files: files || [],
      owner: ownerId,
      createdBy: currentUser._id,
      assignedTo: assignedTo || null,
      financialInfo: preparedFinancialInfo, // 🟢 حفظ البيانات المالية
    });

    await User.findByIdAndUpdate(ownerId, {
      $set: { 'firmInfo.currentCasesCount': currentCasesCount + 1 }
    });

    return NextResponse.json({
      success: true,
      data: newCase,
      remainingCases: owner.firmInfo.subscriptionPlan === 'free'
        ? (owner.firmInfo.maxCases || 50) - currentCasesCount - 1
        : null
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating case:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create case." },
      { status: 500 }
    );
  }
}