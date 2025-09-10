/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Case from "@/models/Case";
import { getServerSession } from "next-auth";
import { v2 as cloudinary } from "cloudinary";
import { authOptions } from "@/lib/auth";

// تهيئة Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ---------------- GET ----------------
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
    const caseDetails = await Case.findById(id).populate("client");
    if (!caseDetails) {
      return NextResponse.json(
        { success: false, message: "الدعوى غير موجودة" },
        { status: 404 }
      );
    }

    if (caseDetails.owner.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, message: "غير مصرح لك بالوصول إلى هذه الدعوى" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: caseDetails }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching case details:", error);
    return NextResponse.json(
      { success: false, message: error.message || "فشل في جلب تفاصيل الدعوى" },
      { status: 500 }
    );
  }
}

// ---------------- DELETE ----------------
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const params = await context.params;
  const { id } = params;
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json(
      { success: false, message: "غير مصرح لك بالحذف" },
      { status: 401 }
    );
  }

  try {
    const caseToDelete = await Case.findById(id);
    if (!caseToDelete) {
      return NextResponse.json(
        { success: false, message: "الدعوى غير موجودة" },
        { status: 404 }
      );
    }

    if (caseToDelete.owner.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, message: "غير مصرح لك بحذف هذه الدعوى" },
        { status: 403 }
      );
    }

    // حذف الملفات من Cloudinary
    if (caseToDelete.files?.length > 0) {
      for (const fileUrl of caseToDelete.files) {
        const parts = fileUrl.split("/");
        const fileNameWithExtension = parts.pop();
        let publicId = fileNameWithExtension?.split(".")[0];

        const folderIndex = parts.indexOf("cases");
        if (folderIndex !== -1 && publicId) {
          const folderPath = parts.slice(folderIndex).join("/");
          publicId = `${folderPath}/${publicId}`;
        }

        if (publicId) {
          console.log(`Deleting Cloudinary asset: ${publicId}`);
          await cloudinary.uploader.destroy(publicId);
        }
      }
    }

    const deletedCase = await Case.findByIdAndDelete(id);
    if (!deletedCase) {
      return NextResponse.json(
        { success: false, message: "فشل في حذف الدعوى بعد التحقق." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "تم حذف الدعوى والملفات المرتبطة بنجاح." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting case:", error);
    return NextResponse.json(
      { success: false, message: error.message || "فشل في حذف الدعوى" },
      { status: 500 }
    );
  }
}

// ---------------- PUT ----------------
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
      caseDate,
      sessiondate,
      opponents,
      files,
    } = body;

    const existingCase = await Case.findById(id);
    if (!existingCase) {
      return NextResponse.json(
        { success: false, message: "الدعوى غير موجودة" },
        { status: 404 }
      );
    }

    if (existingCase.owner.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, message: "غير مصرح لك بتحديث هذه الدعوى" },
        { status: 403 }
      );
    }

    const updatedCase = await Case.findByIdAndUpdate(
      id,
      {
        client,
        caseTypeOF,
        type,
        court,
        caseNumber,
        year,
        attorneyNumber,
        decision,
        nots,
        caseDate,
        sessiondate,
        opponents,
        files,
      },
      { new: true, runValidators: true }
    ).populate("client");

    if (!updatedCase) {
      return NextResponse.json(
        { success: false, message: "فشل في تحديث الدعوى" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: updatedCase }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating case:", error);
    return NextResponse.json(
      { success: false, message: error.message || "فشل في تحديث الدعوى" },
      { status: 500 }
    );
  }
}
