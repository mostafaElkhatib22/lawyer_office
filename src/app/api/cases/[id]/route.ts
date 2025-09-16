/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Case from "@/models/Case";
import { getServerSession } from "next-auth";
import { v2 as cloudinary } from "cloudinary";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";

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

  if (!session || !session.user || !session.user.id) {
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

    const caseDetails = await Case.findById(id)
      .populate("client")
    if (!caseDetails) {
      return NextResponse.json(
        { success: false, message: "الدعوى غير موجودة" },
        { status: 404 }
      );
    }

    // السماح أو المنع حسب نوع الحساب والصلاحيات
    if (user.accountType === "owner") {
      // المالك لازم يكون هو الـ owner
      if (caseDetails.owner.toString() !== user._id.toString()) {
        return NextResponse.json(
          { success: false, message: "غير مصرح لك بالوصول إلى هذه الدعوى" },
          { status: 403 }
        );
      }
    } else {
      // employee
      const ownerId = user.ownerId;
      if (!ownerId) {
        return NextResponse.json(
          { success: false, message: "لا يوجد مالك مرتبط بهذا الموظف" },
          { status: 400 }
        );
      }

      if (typeof user.hasPermission === "function" && user.hasPermission("cases", "viewAll")) {
        // الموظف شايف كل قضايا المكتب
        if (caseDetails.owner.toString() !== ownerId.toString()) {
          return NextResponse.json(
            { success: false, message: "غير مصرح لك بالوصول إلى هذه الدعوى" },
            { status: 403 }
          );
        }
      } else if (typeof user.hasPermission === "function" && user.hasPermission("cases", "view")) {
        // الموظف شايف القضايا المعيّنة له أو اللي هو أنشأها
        if (
          caseDetails.assignedTo?.toString() !== user._id.toString() &&
          caseDetails.createdBy?.toString() !== user._id.toString()
        ) {
          return NextResponse.json(
            { success: false, message: "غير مصرح لك بالوصول إلى هذه الدعوى" },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          { success: false, message: "ليس لديك صلاحية لعرض القضايا" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { success: true, data: caseDetails },
      { status: 200 }
    );
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
    const currentUser = await User.findById(session.user.id);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    const caseToDelete = await Case.findById(id);
    if (!caseToDelete) {
      return NextResponse.json(
        { success: false, message: "الدعوى غير موجودة" },
        { status: 404 }
      );
    }

    // ✅ التحقق من الصلاحيات
    if (currentUser.accountType === "owner") {
      if (caseToDelete.owner.toString() !== currentUser._id.toString()) {
        return NextResponse.json(
          { success: false, message: "غير مصرح لك بحذف هذه الدعوى" },
          { status: 403 }
        );
      }
    } else if (currentUser.accountType === "employee") {
      if (!currentUser.permissions?.cases?.delete) {
        return NextResponse.json(
          { success: false, message: "ليس لديك صلاحية لحذف القضايا" },
          { status: 403 }
        );
      }
      if (caseToDelete.owner.toString() !== currentUser.ownerId.toString()) {
        return NextResponse.json(
          { success: false, message: "غير مصرح لك بحذف قضايا خارج مكتبك" },
          { status: 403 }
        );
      }
    }

    // 🗑️ حذف الملفات من Cloudinary (نفس الكود بتاعك)
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

    await Case.findByIdAndDelete(id);

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
    const currentUser = await User.findById(session.user.id);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const existingCase = await Case.findById(id);
    if (!existingCase) {
      return NextResponse.json(
        { success: false, message: "الدعوى غير موجودة" },
        { status: 404 }
      );
    }

    // ✅ التحقق من الصلاحيات
    if (currentUser.accountType === "owner") {
      if (existingCase.owner.toString() !== currentUser._id.toString()) {
        return NextResponse.json(
          { success: false, message: "غير مصرح لك بتحديث هذه الدعوى" },
          { status: 403 }
        );
      }
    } else if (currentUser.accountType === "employee") {
      if (!currentUser.permissions?.cases?.edit) {
        return NextResponse.json(
          { success: false, message: "ليس لديك صلاحية لتحديث القضايا" },
          { status: 403 }
        );
      }
      if (existingCase.owner.toString() !== currentUser.ownerId.toString()) {
        return NextResponse.json(
          { success: false, message: "غير مصرح لك بتحديث قضايا خارج مكتبك" },
          { status: 403 }
        );
      }
    }

    // 🟢 تجهيز بيانات التحديث
    const updateData: any = {};
    for (const key in body) {
      if (body[key] !== undefined) updateData[key] = body[key];
    }

    const updatedCase = await Case.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true, timestamps: true }
    ).populate("client");

    return NextResponse.json(
      { success: true, data: updatedCase, message: "تم تحديث الدعوى بنجاح" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating case:", error);
    return NextResponse.json(
      { success: false, message: error.message || "فشل في تحديث الدعوى" },
      { status: 500 }
    );
  }
}
