// src/app/api/employees/[employeeId]/permissions/route.ts
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

// تحديث صلاحيات موظف
export async function PUT(
  req: Request,
  { params }: { params: { employeeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "يجب تسجيل الدخول أولاً." },
        { status: 401 }
      );
    }

    // التحقق من صلاحية إدارة الموظفين
    if (session.user.accountType !== 'owner' && !session.user.permissions?.employees?.managePermissions) {
      return NextResponse.json(
        { success: false, message: "ليس لديك صلاحية لتعديل صلاحيات الموظفين." },
        { status: 403 }
      );
    }

    await dbConnect();

    const { employeeId } = params;
    const { permissions } = await req.json();

    // البحث عن الموظف
    const employee = await User.findById(employeeId);
    if (!employee) {
      return NextResponse.json(
        { success: false, message: "الموظف غير موجود." },
        { status: 404 }
      );
    }

    // التحقق من أن الموظف تابع لنفس المكتب
    const ownerId = session.user.accountType === 'owner' 
      ? session.user.id 
      : session.user.ownerId;

    if (employee.ownerId?.toString() !== ownerId) {
      return NextResponse.json(
        { success: false, message: "لا يمكنك تعديل صلاحيات موظف من مكتب آخر." },
        { status: 403 }
      );
    }

    // التحقق من أن المستخدم لا يحاول تعديل صلاحيات صاحب المكتب
    if (employee.accountType === 'owner') {
      return NextResponse.json(
        { success: false, message: "لا يمكن تعديل صلاحيات صاحب المكتب." },
        { status: 400 }
      );
    }

    // تحديث الصلاحيات
    employee.permissions = permissions;
    await employee.save();

    return NextResponse.json({
      success: true,
      message: "تم تحديث صلاحيات الموظف بنجاح.",
      data: {
        id: employee._id,
        name: employee.name,
        permissions: employee.permissions
      }
    });

  } catch (error: any) {
    console.error("Error updating employee permissions:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء تحديث الصلاحيات." },
      { status: 500 }
    );
  }
}

// الحصول على صلاحيات موظف محدد
export async function GET(
  req: Request,
  { params }: { params: { employeeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "يجب تسجيل الدخول أولاً." },
        { status: 401 }
      );
    }

    await dbConnect();
    const { employeeId } = params;

    // البحث عن الموظف
    const employee = await User.findById(employeeId).select('name email role department permissions accountType ownerId');
    if (!employee) {
      return NextResponse.json(
        { success: false, message: "الموظف غير موجود." },
        { status: 404 }
      );
    }

    // التحقق من الصلاحية
    const ownerId = session.user.accountType === 'owner' 
      ? session.user.id 
      : session.user.ownerId;

    const canView = 
      employee.ownerId?.toString() === ownerId || // نفس المكتب
      employee._id.toString() === session.user.id; // المستخدم نفسه

    if (!canView) {
      return NextResponse.json(
        { success: false, message: "ليس لديك صلاحية لعرض هذه البيانات." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        department: employee.department,
        permissions: employee.permissions,
        accountType: employee.accountType
      }
    });

  } catch (error: any) {
    console.error("Error fetching employee permissions:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء جلب الصلاحيات." },
      { status: 500 }
    );
  }
}