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
// ✅ Route Segment Config
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const maxDuration = 30;

export async function GET(req: Request) {
  const startTime = Date.now();
  
  try {
    // ✅ 1. Connect to database with timeout
    console.log('🔄 Connecting to database...');
    await Promise.race([
      dbConnect(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout')), 8000)
      )
    ]);
    console.log(`✅ Database connected in ${Date.now() - startTime}ms`);

    // ✅ 2. Get session with timeout
    const sessionStart = Date.now();
    const session = await Promise.race([
      getServerSession(authOptions),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session timeout')), 5000)
      )
    ]) as any;
    console.log(`✅ Session retrieved in ${Date.now() - sessionStart}ms`);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 }
      );
    }

    // ✅ 3. Get user with timeout and lean
    const userStart = Date.now();
    const user = await User.findById(session.user.id)
      .select('accountType ownerId permissions')
      .lean()
      .maxTimeMS(5000);
      
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      );
    }
    console.log(`✅ User found in ${Date.now() - userStart}ms`);

    // ✅ 4. Build query
    let query: any = {};

    if (user.accountType === "owner") {
      query.owner = user._id;
    } else if (user.accountType === "employee") {
      // تأكد إن الـ hasPermission موجودة كـ method أو استخدم permissions array
      const hasViewAllPermission = user.permissions?.some(
        (p: any) => p.resource === "cases" && p.action === "viewAll"
      );

      if (hasViewAllPermission) {
        query.owner = user.ownerId;
      } else {
        query.owner = user.ownerId;
        query.assignedTo = user._id;
      }
    }

    // ✅ 5. Fetch cases with optimizations
    const casesStart = Date.now();
    console.log('🔄 Fetching cases with query:', query);
    
    const cases = await Case.find(query)
      .sort({ createdAt: -1 })
      .populate({
        path: "client",
        select: "name phone email", // ✅ جيب الحقول المهمة بس
      })
      .select('-__v') // ✅ ما تجيبش __v
      .lean() // ✅ مهم جداً للأداء
      .maxTimeMS(15000); // ✅ 15 seconds max

    console.log(`✅ Cases fetched (${cases.length} records) in ${Date.now() - casesStart}ms`);
    console.log(`⏱️ Total request time: ${Date.now() - startTime}ms`);

    return NextResponse.json(
      { 
        success: true, 
        data: cases,
        meta: {
          count: cases.length,
          requestTime: Date.now() - startTime
        }
      }, 
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        }
      }
    );

  } catch (error: any) {
    console.error('❌ Error in GET /api/cases:', {
      message: error.message,
      stack: error.stack,
      time: Date.now() - startTime
    });

    // ✅ رجّع رسالة خطأ واضحة
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || "Failed to fetch cases.",
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
// في src/app/api/cases/route.ts - تعديل دالة POST

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

    // 🟢 تحديد صاحب المكتب
    const ownerId =
      currentUser.accountType === "owner"
        ? currentUser._id
        : currentUser.ownerId;

    // 🟢 جلب بيانات صاحب المكتب للتحقق من الحدود
    const owner = await User.findById(ownerId);
    if (!owner) {
      return NextResponse.json(
        { success: false, message: "لم يتم العثور على بيانات المكتب." },
        { status: 404 }
      );
    }

    // ⚠️ التحقق من عدد الدعاوى الحالية
    const currentCasesCount = await Case.countDocuments({
      owner: ownerId,
    });

    // ⚠️ التحقق من الحد الأقصى (فقط إذا كانت النسخة المجانية)
    if (owner.firmInfo.subscriptionPlan === 'free') {
      const maxCases = owner.firmInfo.maxCases || 50;

      if (currentCasesCount >= maxCases) {
        return NextResponse.json(
          {
            success: false,
            limitReached: true,
            message: `لقد وصلت للحد الأقصى من الدعاوى (${maxCases}) في النسخة التجريبية. يرجى الترقية إلى خطة مدفوعة للاستمرار.`,
            currentCount: currentCasesCount,
            maxAllowed: maxCases,
            upgradeRequired: true
          },
          { status: 403 }
        );
      }
    }

    // 🟢 التحقق من الصلاحية
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
          message:
            "Please fill all required fields: Client, Case Type, Nature, Court, Case Number, Year, Attorney Number.",
        },
        { status: 400 }
      );
    }

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
    });

    // ✅ تحديث عداد الدعاوى لدى صاحب المكتب
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
