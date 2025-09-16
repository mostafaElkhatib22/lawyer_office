/* eslint-disable @typescript-eslint/no-explicit-any */
// src/middleware/permissions.ts
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export interface PermissionCheck {
  category: string;
  action: string;
  requireOwnership?: boolean; // هل يجب أن يكون صاحب المكتب
}

export async function checkPermission(
  req: NextRequest,
  permission: PermissionCheck
): Promise<NextResponse | null> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "يجب تسجيل الدخول أولاً." },
        { status: 401 }
      );
    }

    // التحقق من أن الحساب نشط
    if (!session.user.isActive) {
      return NextResponse.json(
        { success: false, message: "تم تعطيل حسابك. يرجى الاتصال بالإدارة." },
        { status: 403 }
      );
    }

    // إذا كان يتطلب أن يكون صاحب المكتب
    if (permission.requireOwnership && session.user.accountType !== 'owner') {
      return NextResponse.json(
        { success: false, message: "هذه العملية متاحة لصاحب المكتب فقط." },
        { status: 403 }
      );
    }

    // التحقق من الصلاحية المحددة
    const userPermissions = session.user.permissions;
    if (!userPermissions?.[permission.category]?.[permission.action]) {
      return NextResponse.json(
        { success: false, message: "ليس لديك صلاحية لتنفيذ هذه العملية." },
        { status: 403 }
      );
    }

    return null; // لا يوجد خطأ، المستخدم له الصلاحية
  } catch (error) {
    console.error("Permission check error:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء التحقق من الصلاحيات." },
      { status: 500 }
    );
  }
}

// دالة للتحقق من انتماء البيانات لنفس المكتب
export function belongsToSameFirm(
  currentUser: any,
  targetOwnerId: string
): boolean {
  if (currentUser.accountType === 'owner') {
    return currentUser.id === targetOwnerId;
  } else {
    return currentUser.ownerId === targetOwnerId;
  }
}

// دالة للحصول على معرف المالك للمستخدم الحالي
export function getCurrentFirmOwnerId(user: any): string {
  return user.accountType === 'owner' ? user.id : user.ownerId;
}