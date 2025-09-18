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

    // 🟢 تحقق من الصلاحية
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

    // 🟢 لو المستخدم Employee نخلي الـ owner هو صاحب المكتب
    const ownerId =
      currentUser.accountType === "owner"
        ? currentUser._id
        : currentUser.ownerId;

    const newCase = await Case.create({
      client,
      caseTypeOF,
      type,
      court,
      caseNumber,
      year,
      status,
      attorneyNumber,
      decision: decision || "",
      nots: nots || "",
      caseDate: caseDate ? new Date(caseDate) : new Date(),
      sessiondate: sessiondate ? new Date(sessiondate) : new Date(),
      opponents: opponents || [],
      files: files || [],
      owner: ownerId, // ✅ دايمًا الـ Owner هو صاحب المكتب
      createdBy: currentUser._id, // ✅ المستخدم اللي أنشأ القضية
      assignedTo: assignedTo || null,
    });

    return NextResponse.json({ success: true, data: newCase }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating case:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create case." },
      { status: 500 }
    );
  }
}
