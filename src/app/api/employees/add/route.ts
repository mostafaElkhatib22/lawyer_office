// src/app/api/employees/add/route.ts
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

interface AddEmployeeRequestBody {
  name: string;
  email: string;
  password: string;
  role: string;
  department: string;
  employeeId: string;
  phone?: string;
  specialization?: string[];
  contractType?: string;
}

export async function POST(req: Request) {
  try {
    // التحقق من تسجيل الدخول
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "يجب تسجيل الدخول أولاً." },
        { status: 401 }
      );
    }
    // التحقق من أن المستخدم هو صاحب مكتب
    if (session.user.accountType !== 'owner') {
      return NextResponse.json(
        { success: false, message: "فقط صاحب المكتب يمكنه إضافة الموظفين." },
        { status: 403 }
      );
    }

    // التحقق من صلاحية إدارة الموظفين
    if (!session.user.permissions?.employees?.create) {
      return NextResponse.json(
        { success: false, message: "ليس لديك صلاحية لإضافة الموظفين." },
        { status: 403 }
      );
    }

    await dbConnect();

    // استلام البيانات
    const body: AddEmployeeRequestBody = await req.json();
    const { 
      name, 
      email, 
      password, 
      role, 
      department, 
      employeeId, 
      phone, 
      specialization, 
      contractType 
    } = body;

    // التحقق من البيانات المطلوبة
    if (!name || !email || !password || !role || !department || !employeeId) {
      return NextResponse.json(
        { 
          success: false, 
          message: "يرجى إدخال جميع البيانات المطلوبة." 
        },
        { status: 400 }
      );
    }

    // التحقق من صحة الدور
    const validRoles = [
      'partner', 'senior_lawyer', 'lawyer', 'junior_lawyer',
      'legal_assistant', 'secretary', 'accountant', 'intern'
    ];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, message: "دور الموظف غير صحيح." },
        { status: 400 }
      );
    }

    // التحقق من عدم وجود مستخدم بنفس البريد الإلكتروني
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return NextResponse.json(
        { success: false, message: "يوجد مستخدم آخر بهذا البريد الإلكتروني." },
        { status: 409 }
      );
    }

    // التحقق من عدم تكرار رقم الموظف في نفس المكتب
    const existingEmployeeId = await User.findOne({
      ownerId: session.user.id,
      'employeeInfo.employeeId': employeeId
    });
    if (existingEmployeeId) {
      return NextResponse.json(
        { success: false, message: "رقم الموظف مستخدم من قبل في المكتب." },
        { status: 409 }
      );
    }

    // الحصول على بيانات صاحب المكتب للتحقق من الحد الأقصى
    const owner = await User.findById(session.user.id);
    if (!owner) {
      return NextResponse.json(
        { success: false, message: "لم يتم العثور على بيانات صاحب المكتب." },
        { status: 404 }
      );
    }

    // التحقق من عدد الموظفين الحالي
    const currentEmployeesCount = await User.countDocuments({
      ownerId: session.user.id,
      accountType: 'employee',
      isActive: true
    });

    const maxEmployees = owner.firmInfo?.maxEmployees || 5;
    if (currentEmployeesCount >= maxEmployees) {
      return NextResponse.json(
        { 
          success: false, 
          message: `لقد وصلت للحد الأقصى من الموظفين (${maxEmployees}). يرجى ترقية خطة الاشتراك.` 
        },
        { status: 400 }
      );
    }

    // إنشاء الموظف الجديد
    const newEmployee = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      accountType: 'employee',
      ownerId: session.user.id,
      role,
      department,
      employeeInfo: {
        employeeId,
        phone: phone?.trim(),
        specialization: specialization || [],
        contractType: contractType || 'full_time',
        hireDate: new Date(),
      },
      createdBy: session.user.id,
      isActive: true,
    });

    // إرجاع البيانات بدون كلمة المرور
    const employeeData = {
      id: newEmployee._id,
      name: newEmployee.name,
      email: newEmployee.email,
      role: newEmployee.role,
      department: newEmployee.department,
      employeeInfo: newEmployee.employeeInfo,
      isActive: newEmployee.isActive,
      createdAt: newEmployee.createdAt,
    };

    return NextResponse.json(
      {
        success: true,
        message: "تم إضافة الموظف بنجاح!",
        data: employeeData,
        remainingSlots: maxEmployees - currentEmployeesCount - 1,
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Error adding employee:", error);
    
    // معالجة أخطاء MongoDB
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return NextResponse.json(
        { success: false, message: `${field} مستخدم من قبل.` },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        message: error.message || "حدث خطأ أثناء إضافة الموظف." 
      },
      { status: 500 }
    );
  }
}

// الحصول على قائمة الموظفين لصاحب المكتب
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "يجب تسجيل الدخول أولاً." },
        { status: 401 }
      );
    }

    // التحقق من أن المستخدم هو صاحب مكتب أو له صلاحية عرض الموظفين
    if (session.user.accountType !== 'owner' && !session.user.permissions?.employees?.view) {
      return NextResponse.json(
        { success: false, message: "ليس لديك صلاحية لعرض الموظفين." },
        { status: 403 }
      );
    }

    await dbConnect();

    // تحديد المالك (إما المستخدم الحالي أو المالك إذا كان موظف)
    const ownerId = session.user.accountType === 'owner' 
      ? session.user.id 
      : session.user.ownerId;

    // الحصول على قائمة الموظفين
    const employees = await User.find({
      ownerId,
      accountType: 'employee'
    })
    .select('-password')
    .sort({ createdAt: -1 });

    // إحصائيات المكتب
    const stats = await User.getFirmStats(ownerId);
    
    // الحصول على بيانات المالك لمعرفة الحد الأقصى
    const owner = await User.findById(ownerId).select('firmInfo.maxEmployees firmInfo.subscriptionPlan');

    return NextResponse.json({
      success: true,
      data: {
        employees,
        stats: {
          total: stats.totalEmployees,
          active: stats.activeEmployees,
          inactive: stats.totalEmployees - stats.activeEmployees,
          maxAllowed: owner?.firmInfo?.maxEmployees || 5,
          remainingSlots: (owner?.firmInfo?.maxEmployees || 5) - stats.activeEmployees,
          subscriptionPlan: owner?.firmInfo?.subscriptionPlan || 'basic'
        }
      }
    });

  } catch (error: any) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء جلب قائمة الموظفين." },
      { status: 500 }
    );
  }
}