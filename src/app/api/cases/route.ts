/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/api/cases/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import dbConnect from "@/lib/dbConnect";
import Case from "@/models/Case";
import Client from "@/models/Client"; // ✅ أضف هذا السطر
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(req: Request) {
  await dbConnect();

  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json(
      { success: false, message: "Authentication required." },
      { status: 401 }
    );
  }

  const lawyerId = session.user.id;
  try {
    // استخدم populate("client") لملء بيانات الموكل
     await Client.findOne({ owner: lawyerId });
    const cases = await Case.find({ owner: lawyerId }).sort({ createdAt: -1 }).populate("client");
    console.log(lawyerId)
    console.log("cases fetched with populate:", cases);
    return NextResponse.json({ success: true, data: cases }, { status: 200 });
  } catch (error: any) { // تم تغيير unknown إلى any ليتناسب مع console.error
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

  const lawyerId = session.user.id;

  try {
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
      status,
      attorneyNumber,
      decision: decision || "",
      nots: nots || "",
      caseDate: caseDate ? new Date(caseDate) : new Date(),
      sessiondate: sessiondate ? new Date(sessiondate) : new Date(),
      opponents: opponents || [],
      files: files || [],
      owner: lawyerId,
    });

    return NextResponse.json({ success: true, data: newCase }, { status: 201 });
  } catch (error: any) { // تم تغيير unknown إلى any ليتناسب مع console.error
    console.error("Error creating case:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (val: any) => val.message
      );
      return NextResponse.json(
        { success: false, message: messages.join(", ") },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Failed to create case." },
      { status: 500 }
    );
  }
}
