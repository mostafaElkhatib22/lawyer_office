/* eslint-disable @typescript-eslint/no-explicit-any */
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// تحديث صلاحيات موظف أو بياناته أو حالته
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ employeeId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "يجب تسجيل الدخول أولاً." },
        { status: 401 }
      );
    }

    if (
      session.user.accountType !== "owner" &&
      !session.user.permissions?.employees?.managePermissions
    ) {
      return NextResponse.json(
        { success: false, message: "ليس لديك صلاحية لتعديل صلاحيات الموظفين." },
        { status: 403 }
      );
    }

    await dbConnect();
    
    // استخراج الـ params بطريقة صحيحة
    const resolvedParams = await context.params;
    const { employeeId } = resolvedParams;

    // طباعة للتأكد من الـ ID
    console.log('Employee ID received:', employeeId);

    // التحقق من صحة الـ ID
    if (!employeeId || employeeId === 'undefined') {
      return NextResponse.json(
        { success: false, message: "معرف الموظف غير صحيح." },
        { status: 400 }
      );
    }

    const requestBody = await req.json();
    console.log('Request body:', requestBody);

    const employee = await User.findById(employeeId);
    if (!employee) {
      return NextResponse.json(
        { success: false, message: "الموظف غير موجود." },
        { status: 404 }
      );
    }

    const ownerId =
      session.user.accountType === "owner"
        ? session.user.id
        : session.user.ownerId;

    if (employee.ownerId?.toString() !== ownerId) {
      return NextResponse.json(
        { success: false, message: "لا يمكنك تعديل صلاحيات موظف من مكتب آخر." },
        { status: 403 }
      );
    }

    if (employee.accountType === "owner") {
      return NextResponse.json(
        { success: false, message: "لا يمكن تعديل صلاحيات صاحب المكتب." },
        { status: 400 }
      );
    }

    // تحديث الصلاحيات إذا تم إرسالها
    if (requestBody.permissions) {
      employee.permissions = requestBody.permissions;
    }

    // تحديث حالة التفعيل إذا تم إرسالها
    if (typeof requestBody.isActive === 'boolean') {
      employee.isActive = requestBody.isActive;
    }

    // تحديث بيانات الموظف إذا تم إرسالها
    if (requestBody.employeeData) {
      const { employeeData } = requestBody;
      
      if (employeeData.name) employee.name = employeeData.name;
      if (employeeData.email) employee.email = employeeData.email;
      if (employeeData.role) employee.role = employeeData.role;
      if (employeeData.department) employee.department = employeeData.department;
      
      if (employeeData.employeeInfo) {
        employee.employeeInfo = {
          ...employee.employeeInfo,
          ...employeeData.employeeInfo
        };
      }
    }

    await employee.save();

    return NextResponse.json({
      success: true,
      message: "تم تحديث بيانات الموظف بنجاح.",
      data: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        department: employee.department,
        isActive: employee.isActive,
        employeeInfo: employee.employeeInfo,
        permissions: employee.permissions,
      },
    });
  } catch (error: any) {
    console.error("Error updating employee permissions:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء تحديث الصلاحيات." },
      { status: 500 }
    );
  }
}

// باقي الكود (GET و DELETE) كما هو




// باقي الكود (GET و DELETE) يبقى كما هو...

// باقي الكود (GET و DELETE) يبقى كما هو...

// الحصول على صلاحيات موظف محدد
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ employeeId: string }> }
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
    const params = context.params;
    const { employeeId } = await params;

    const employee = await User.findById(employeeId).select(
      "name email role department permissions accountType ownerId"
    );
    if (!employee) {
      return NextResponse.json(
        { success: false, message: "الموظف غير موجود." },
        { status: 404 }
      );
    }

    const ownerId =
      session.user.accountType === "owner"
        ? session.user.id
        : session.user.ownerId;

    const canView =
      employee.ownerId?.toString() === ownerId ||
      employee.id.toString() === session.user.id;

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
        accountType: employee.accountType,
      },
    });
  } catch (error: any) {
    console.error("Error fetching employee permissions:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء جلب الصلاحيات." },
      { status: 500 }
    );
  }
}
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ employeeId: string }> }

) {
  try {
    await dbConnect();

    const params = await context.params
    const { employeeId } = params;
    const employee = await User.findByIdAndDelete(employeeId);

    if (!employee) {
      return NextResponse.json(
        { success: false, message: "الموظف غير موجود" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "تم حذف الموظف بنجاح" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting employee:", error);
    return NextResponse.json(
      { success: false, message: "حصل خطأ أثناء حذف الموظف" },
      { status: 500 }
    );
  }
}