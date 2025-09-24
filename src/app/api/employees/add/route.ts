/* eslint-disable @typescript-eslint/no-explicit-any */
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

    // ✅ إزالة التحقق من permissions للـ owner لأنه يجب أن يكون له صلاحية كاملة
    // المالك له صلاحية كاملة بدون التحقق من permissions
    console.log('Owner creating employee:', {
      userId: session.user.id,
      accountType: session.user.accountType,
      permissions: session.user.permissions
    });

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

    console.log('Received employee data:', { name, email, role, department, employeeId });

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
    const existingUserByEmail = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUserByEmail) {
      return NextResponse.json(
        { success: false, message: "يوجد مستخدم آخر بهذا البريد الإلكتروني." },
        { status: 409 }
      );
    }

    // التحقق من عدم تكرار رقم الموظف في نفس المكتب
    const existingEmployeeId = await User.findOne({
      ownerId: session.user.id,
      'employeeInfo.employeeId': employeeId.trim()
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

    console.log('Owner found:', {
      id: owner._id,
      maxEmployees: owner.firmInfo?.maxEmployees
    });

    // التحقق من عدد الموظفين الحالي
    const currentEmployeesCount = await User.countDocuments({
      ownerId: session.user.id,
      accountType: 'employee',
      isActive: true
    });

    const maxEmployees = owner.firmInfo?.maxEmployees || 5;
    console.log('Employee count check:', {
      currentEmployeesCount,
      maxEmployees,
      canAdd: currentEmployeesCount < maxEmployees
    });

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
    console.log('Creating new employee...');
    
    const newEmployee = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      accountType: 'employee',
      ownerId: session.user.id,
      role,
      department,
      employeeInfo: {
        employeeId: employeeId.trim(),
        phone: phone?.trim(),
        specialization: specialization || [],
        contractType: contractType || 'full_time',
        hireDate: new Date(),
      },
      createdBy: session.user.id,
      isActive: true,
    });

    console.log('Employee created successfully:', newEmployee._id);

    // إرجاع البيانات بدون كلمة المرور
    const employeeData = {
      _id: newEmployee._id,
      name: newEmployee.name,
      email: newEmployee.email,
      role: newEmployee.role,
      department: newEmployee.department,
      employeeInfo: newEmployee.employeeInfo,
      isActive: newEmployee.isActive,
      createdAt: newEmployee.createdAt,
      permissions: newEmployee.permissions,
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
      const message = field === 'email' 
        ? 'البريد الإلكتروني مستخدم من قبل'
        : `${field} مستخدم من قبل`;
      return NextResponse.json(
        { success: false, message },
        { status: 409 }
      );
    }

    // معالجة أخطاء Mongoose validation
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, message: messages.join(', ') },
        { status: 400 }
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

    // ✅ المالك له صلاحية كاملة لعرض الموظفين
    if (session.user.accountType !== "owner" && !session.user.permissions?.employees?.view) {
      return NextResponse.json(
        { success: false, message: "ليس لديك صلاحية لعرض الموظفين." },
        { status: 403 }
      );
    }

    await dbConnect();

    // تحديد المالك (إما المستخدم الحالي أو المالك إذا كان موظف)
    const ownerId = session.user.accountType === "owner" 
      ? session.user.id 
      : session.user.ownerId;

    console.log('Fetching employees for owner:', ownerId);

    // الحصول على قائمة الموظفين كـ plain objects
    const employees = await User.find({
      ownerId,
      accountType: "employee",
    })
      .select("-password -resetPasswordToken -resetPasswordExpire")
      .sort({ createdAt: -1 })
      .lean();

    console.log('Found employees:', employees.length);

    // إحصائيات المكتب
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(emp => emp.isActive).length;

    // الحصول على بيانات المالك لمعرفة الحد الأقصى
    const owner = await User.findById(ownerId)
      .select("firmInfo.maxEmployees firmInfo.subscriptionPlan")
      .lean();

    const stats = {
      total: totalEmployees,
      active: activeEmployees,
      inactive: totalEmployees - activeEmployees,
      maxAllowed: owner?.firmInfo?.maxEmployees || 5,
      remainingSlots: (owner?.firmInfo?.maxEmployees || 5) - activeEmployees,
      subscriptionPlan: owner?.firmInfo?.subscriptionPlan || "basic",
    };

    console.log('Employee stats:', stats);

    return NextResponse.json({
      success: true,
      data: {
        employees,
        stats,
      },
    });

  } catch (error: any) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء جلب قائمة الموظفين." },
      { status: 500 }
    );
  }
}