/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { authOptions } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";
import dbConnect from "@/lib/dbConnect";
import Case from "@/models/Case";
import Client from "@/models/Client";
import User from "@/models/User";
import { IUser } from "@/types/user";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const params = await context.params;
    const { id } = params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, message: "غير مصرح لك بالوصول" },
        { status: 401 }
      );
    }
    const singleClient = await Client.findOne({ _id: id });
    if (!singleClient) {
      return NextResponse.json({ message: "هذا الموكل غير موجود" }, { status: 200 });
    }
    return NextResponse.json({ singleClient }, { status: 200 });


  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });

  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
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

    const currentUser = await User.findById(session.user.id) as IUser | null;
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    const clientToDelete = await Client.findById(id);
    if (!clientToDelete) {
      return NextResponse.json(
        { success: false, message: "العميل غير موجود" },
        { status: 404 }
      );
    }

    // 👇 صلاحيات الحذف
    if (currentUser.accountType === "owner") {
      // الأونر يقدر يحذف أي عميل من المكتب
    } else if (currentUser.accountType === "employee") {
      if (!currentUser.permissions?.clients?.delete) {
        return NextResponse.json(
          { success: false, message: "ليس لديك صلاحية لحذف الموكلين" },
          { status: 403 }
        );
      }
      if (!currentUser.ownerId || clientToDelete.owner.toString() !== currentUser.ownerId.toString()) {
        return NextResponse.json(
          { success: false, message: "غير مصرح لك بحذف موكلين خارج مكتبك" },
          { status: 403 }
        );
      }
    }

    // 🗑️ حذف القضايا والملفات المرتبطة
    const casesToDelete = await Case.find({ client: id });
    const allPublicIds: string[] = [];

    for (const caseItem of casesToDelete) {
      if (Array.isArray(caseItem.files)) {
        for (const file of caseItem.files) {
          if (file?.publicId) {
            allPublicIds.push(file.publicId);
          } else if (typeof file === 'string') {
            const regex = /\/v\d+\/(.*)\.\w{3,4}$/;
            const match = file.match(regex);
            if (match?.[1]) {
              allPublicIds.push(match[1]);
            }
          }
        }
      }
    }

    if (allPublicIds.length > 0) {
      try {
        await cloudinary.api.delete_resources(allPublicIds);
        console.log("تم حذف الملفات من Cloudinary بنجاح");
      } catch (cloudinaryError) {
        console.error("خطأ أثناء حذف الملفات من Cloudinary:", cloudinaryError);
      }
    }

    await Case.deleteMany({ client: id });
    await Client.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "تم حذف الموكل وجميع القضايا والملفات المرتبطة به بنجاح" },
      { status: 200 }
    );

  } catch (error) {
    console.error("خطأ أثناء الحذف:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ غير متوقع أثناء عملية الحذف" },
      { status: 500 }
    );
  }
}



export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();

    const params = await context.params;
    const { id } = params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, message: "غير مصرح لك بالتعديل" },
        { status: 401 }
      );
    }

    const currentUser = await User.findById(session.user.id) as IUser | null;
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    const clientToUpdate = await Client.findById(id);
    if (!clientToUpdate) {
      return NextResponse.json(
        { success: false, message: "العميل غير موجود" },
        { status: 404 }
      );
    }

    // 👇 صلاحيات التعديل
    if (currentUser.accountType === "owner") {
      // الأونر يقدر يعدل أي عميل من المكتب
    } else if (currentUser.accountType === "employee") {
      if (!currentUser.permissions?.clients?.edit) {
        return NextResponse.json(
          { success: false, message: "ليس لديك صلاحية لتعديل الموكلين" },
          { status: 403 }
        );
      }
      if (!currentUser.ownerId || clientToUpdate.owner.toString() !== currentUser.ownerId.toString()) {
        return NextResponse.json(
          { success: false, message: "غير مصرح لك بتعديل موكلين خارج مكتبك" },
          { status: 403 }
        );
      }
    }

    // ✅ التعديل
    const body = await request.json();
    const updatedClient = await Client.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    return NextResponse.json(
      { success: true, message: "تم تعديل بيانات الموكل بنجاح", data: updatedClient },
      { status: 200 }
    );

  } catch (error) {
    console.error("خطأ أثناء التعديل:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ غير متوقع أثناء عملية التعديل" },
      { status: 500 }
    );
  }
}
