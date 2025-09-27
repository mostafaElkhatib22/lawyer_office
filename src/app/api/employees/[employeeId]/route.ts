/* eslint-disable @typescript-eslint/no-explicit-any */
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// تعديل بيانات موظف
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

        if (session.user.accountType !== "owner") {
            return NextResponse.json(
                { success: false, message: "ليس لديك صلاحية لتعديل الموظفين." },
                { status: 403 }
            );
        }

        await dbConnect();
        const resolvedParams = await context.params;
        const { employeeId } = resolvedParams;

        console.log('Employee ID received for edit:', employeeId);

        if (!employeeId || employeeId === 'undefined') {
            return NextResponse.json(
                { success: false, message: "معرف الموظف غير صحيح." },
                { status: 400 }
            );
        }

        const updateData = await req.json();
        console.log('Update data:', updateData);

        const employee = await User.findById(employeeId);
        if (!employee) {
            return NextResponse.json(
                { success: false, message: "الموظف غير موجود." },
                { status: 404 }
            );
        }

        // التحقق من أن الموظف ينتمي لنفس المكتب
        const ownerId = session.user.id;
        if (employee.ownerId?.toString() !== ownerId && (employee as any)._id.toString() !== ownerId) {
            return NextResponse.json(
                { success: false, message: "لا يمكنك تعديل موظف من مكتب آخر." },
                { status: 403 }
            );
        }

        // تحديث البيانات
        if (updateData.name) employee.name = updateData.name;
        if (updateData.email) employee.email = updateData.email;
        if (updateData.role) employee.role = updateData.role;
        if (updateData.department) employee.department = updateData.department;
        if (updateData.employeeInfo) {
            employee.employeeInfo = {
                employeeId: updateData.employeeInfo.employeeId || employee.employeeInfo.employeeId,
                phone: updateData.employeeInfo.phone || employee.employeeInfo.phone,
                specialization: updateData.employeeInfo.specialization || employee.employeeInfo.specialization,
                contractType: updateData.employeeInfo.contractType || employee.employeeInfo.contractType,
                hireDate: updateData.employeeInfo.hireDate || employee.employeeInfo.hireDate
            };
        }
        await employee.save();        
        return NextResponse.json({
            success: true,
            message: "تم تحديث بيانات الموظف بنجاح.",
            data: {
                _id: employee._id,
                name: employee.name,
                email: employee.email,
                role: employee.role,
                department: employee.department,
                isActive: employee.isActive,
                employeeInfo: employee.employeeInfo,
                permissions: employee.permissions,
            }
        });
    } catch (error: any) {
        console.error("Error updating employee:", error);
        return NextResponse.json(
            { success: false, message: "حدث خطأ أثناء تحديث الموظف." },
            { status: 500 }
        );
    }
}

// حذف موظف
export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ employeeId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || session.user.accountType !== "owner") {
            return NextResponse.json(
                { success: false, message: "غير مصرح." },
                { status: 403 }
            );
        }

        await dbConnect();
        const resolvedParams = await context.params;
        const { employeeId } = resolvedParams;

        console.log('Employee ID received for delete:', employeeId);

        if (!employeeId || employeeId === 'undefined') {
            return NextResponse.json(
                { success: false, message: "معرف الموظف غير صحيح." },
                { status: 400 }
            );
        }

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