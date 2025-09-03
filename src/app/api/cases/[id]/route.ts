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

// دالة GET لجلب تفاصيل دعوى محددة
export async function GET(req: NextRequest, context: { params: { id: string } }) {
  await dbConnect();
  const { id } =await context.params; // تم التعديل هنا
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
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

    // تحقق من أن المستخدم هو صاحب الدعوى
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

// دالة DELETE لحذف دعوى محددة
export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
  await dbConnect();
  const { id } =await context.params; // تم التعديل هنا
console.log(id)
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json(
      { success: false, message: "غير مصرح لك بالحذف" },
      { status: 401 }
    );
  }

  try {
    // العثور على الدعوى أولاً للتحقق من المالك ولجلب ملفات Cloudinary
    const caseToDelete = await Case.findById(id);
console.log("caseToDelete", caseToDelete);
    if (!caseToDelete) {
      return NextResponse.json(
        { success: false, message: "الدعوى غير موجودة" },
        { status: 404 }
      );
    }

    // التحقق من أن المستخدم الحالي هو مالك الدعوى
    if (caseToDelete.owner.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, message: "غير مصرح لك بحذف هذه الدعوى" },
        { status: 403 }
      );
    }

    // حذف الملفات المرتبطة من Cloudinary
    if (caseToDelete.files && caseToDelete.files.length > 0) {
      for (const fileUrl of caseToDelete.files) {
        // استخراج الـ publicId من الـ URL (مثال: 'cases/abc123def')
        // تحتاج إلى التأكد من أن هذا يتوافق مع كيفية تخزين الـ publicId الخاص بك في قاعدة البيانات
        // إذا كانت ملفاتك في مجلدات فرعية في Cloudinary، فقد تحتاج إلى تعديل هذا.
        // مثال: إذا كان الـ URL هو "https://res.cloudinary.com/.../v12345/folder/subfolder/publicid.ext"
        // فإن publicId سيكون "folder/subfolder/publicid"
        const parts = fileUrl.split('/');
        const fileNameWithExtension = parts.pop(); // "publicid.ext"
        let publicId = fileNameWithExtension?.split('.')[0]; // "publicid"
        
        // إذا كان هناك مجلد مخصص للملفات (مثل 'cases')
        const folderIndex = parts.indexOf('cases');
        if (folderIndex !== -1 && publicId) {
          const folderPath = parts.slice(folderIndex).join('/');
          // إذا كان مسار الـ publicId يشمل المجلد، يجب أن يتطابق مع هذا
          // مثال: 'cases/publicid' أو 'cases/subfolder/publicid'
          publicId = `${folderPath}/${publicId}`; 
        }

        if (publicId) {
          console.log(`Deleting Cloudinary asset: ${publicId}`);
          await cloudinary.uploader.destroy(publicId);
        }
      }
    }

    // حذف الدعوى من قاعدة البيانات
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error deleting case:", error);
    return NextResponse.json(
      { success: false, message: error.message || "فشل في حذف الدعوى" },
      { status: 500 }
    );
  }
}

// دالة PUT لتحديث تفاصيل دعوى محددة
export async function PUT(req: NextRequest, context: { params: { id: string } }) {
  await dbConnect();
  const { id } =await context.params; // تم التعديل هنا

  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json(
      { success: false, message: "غير مصرح لك بالتحديث" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { client, caseTypeOF, type, court, caseNumber, year, attorneyNumber, decision, nots, caseDate, sessiondate, opponents, files } = body;

    // العثور على الدعوى للتحقق من المالك
    const existingCase = await Case.findById(id);

    if (!existingCase) {
      return NextResponse.json(
        { success: false, message: "الدعوى غير موجودة" },
        { status: 404 }
      );
    }

    // التحقق من أن المستخدم الحالي هو مالك الدعوى
    if (existingCase.owner.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, message: "غير مصرح لك بتحديث هذه الدعوى" },
        { status: 403 }
      );
    }

    // إذا كانت هناك ملفات جديدة، قد تحتاج إلى منطق لحذف الملفات القديمة من Cloudinary
    // وإضافة الملفات الجديدة. هذا الجزء يتطلب معالجة إضافية لسيناريوهات الملفات.
    // للحفاظ على البساطة، سنقوم بتحديث الروابط الجديدة مباشرةً.
    // في تطبيق حقيقي، ستحتاج إلى مقارنة 'files' القديمة والجديدة.
    
    const updatedCase = await Case.findByIdAndUpdate(
      id,
      { client, caseTypeOF, type, court, caseNumber, year, attorneyNumber, decision, nots, caseDate, sessiondate, opponents, files },
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
