/* eslint-disable @typescript-eslint/no-explicit-any */
// middleware/auth.ts
import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { getTenantModels } from '../utils/database';

// أنواع البيانات
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'lawyer' | 'assistant' | 'client';
  tenantId: string;
  firmName: string;
  firstName: string;
  lastName: string;
  permissions?: string[];
  isActive: boolean;
}

export interface AuthenticatedRequest extends NextApiRequest {
  user: User;
  tenantId: string;
  models: any; // سيتم تعريفه من getTenantModels
}

export interface JWTPayload {
  id: string;
  email: string;
  role: string;
  tenantId: string;
  firmName: string;
  firstName: string;
  lastName: string;
  iat?: number;
  exp?: number;
}

// وظيفة التحقق من الرمز المميز
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) {
      console.error('JWT_SECRET غير محدد في متغيرات البيئة');
      return null;
    }

    const decoded = jwt.verify(token, secretKey) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('خطأ في التحقق من الرمز المميز:', error);
    return null;
  }
};

// وظيفة إنشاء رمز مميز
export const generateToken = (user: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  const secretKey = process.env.JWT_SECRET;
  if (!secretKey) {
    throw new Error('JWT_SECRET غير محدد في متغيرات البيئة');
  }

  return jwt.sign(user, secretKey, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

// Middleware الأساسي للمصادقة
export const withAuth = (
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void
) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // استخراج الرمز المميز من Header
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          error: 'رمز المصادقة مطلوب',
          code: 'MISSING_TOKEN'
        });
      }

      const token = authHeader.substring(7); // إزالة "Bearer "
      const decoded = verifyToken(token);

      if (!decoded) {
        return res.status(401).json({ 
          error: 'رمز المصادقة غير صحيح',
          code: 'INVALID_TOKEN'
        });
      }

      // إضافة معلومات المستخدم للطلب
      (req as AuthenticatedRequest).user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role as User['role'],
        tenantId: decoded.tenantId,
        firmName: decoded.firmName,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        isActive: true // يمكن التحقق من قاعدة البيانات لاحقاً
      };

      (req as AuthenticatedRequest).tenantId = decoded.tenantId;

      return handler(req as AuthenticatedRequest, res);
    } catch (error) {
      console.error('خطأ في middleware المصادقة:', error);
      return res.status(500).json({ 
        error: 'خطأ في المصادقة',
        code: 'AUTH_ERROR'
      });
    }
  };
};

// Middleware للمصادقة مع تحميل نماذج المستأجر
export const withTenant = (
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void
) => {
  return withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      // تحميل نماذج المستأجر
      const models = await getTenantModels(req.tenantId);
      req.models = models;

      return handler(req, res);
    } catch (error) {
      console.error('خطأ في تحميل نماذج المستأجر:', error);
      return res.status(500).json({ 
        error: 'خطأ في تحميل بيانات المكتب',
        code: 'TENANT_ERROR'
      });
    }
  });
};

// Middleware للتحقق من الأدوار
export const withRole = (allowedRoles: User['role'][]) => {
  return (
    handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void
  ) => {
    return withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ 
          error: 'ليس لديك صلاحية للوصول إلى هذا المورد',
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredRoles: allowedRoles,
          userRole: req.user.role
        });
      }

      return handler(req, res);
    });
  };
};

// Middleware للتحقق من الصلاحيات المحددة
export const withPermission = (requiredPermissions: string[]) => {
  return (
    handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void
  ) => {
    return withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
      const userPermissions = req.user.permissions || [];
      
      // المديرين لديهم جميع الصلاحيات
      if (req.user.role === 'admin') {
        return handler(req, res);
      }

      // التحقق من وجود الصلاحيات المطلوبة
      const hasPermission = requiredPermissions.every(permission =>
        userPermissions.includes(permission)
      );

      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'ليس لديك الصلاحيات المطلوبة',
          code: 'MISSING_PERMISSIONS',
          requiredPermissions,
          userPermissions
        });
      }

      return handler(req, res);
    });
  };
};

// Middleware مركب للمصادقة + الأدوار + المستأجر
export const withAuthAndRole = (allowedRoles: User['role'][]) => {
  return (
    handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void
  ) => {
    return withTenant(
      withRole(allowedRoles)(handler)
    );
  };
};

// التحقق من انتهاء صلاحية الرمز المميز
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    if (!decoded || !decoded.exp) return true;
    
    return Date.now() >= decoded.exp * 1000;
  } catch {
    return true;
  }
};

// تجديد الرمز المميز
export const refreshToken = (oldToken: string): string | null => {
  try {
    const decoded = verifyToken(oldToken);
    if (!decoded) return null;

    // إنشاء رمز جديد بنفس البيانات
    return generateToken({
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      tenantId: decoded.tenantId,
      firmName: decoded.firmName,
      firstName: decoded.firstName,
      lastName: decoded.lastName
    });
  } catch {
    return null;
  }
};

// استخراج معلومات المستخدم من الرمز المميز دون التحقق من صحته
export const decodeTokenUnsafe = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
};

// معالج أخطاء المصادقة المخصص
export const handleAuthError = (error: any, res: NextApiResponse) => {
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'رمز المصادقة غير صالح',
      code: 'INVALID_TOKEN'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'انتهت صلاحية رمز المصادقة',
      code: 'TOKEN_EXPIRED'
    });
  }

  if (error.name === 'NotBeforeError') {
    return res.status(401).json({
      error: 'رمز المصادقة غير نشط بعد',
      code: 'TOKEN_NOT_ACTIVE'
    });
  }

  return res.status(500).json({
    error: 'خطأ في المصادقة',
    code: 'AUTH_ERROR'
  });
};

// مساعدات إضافية للعمل مع المستخدمين
export const getCurrentUser = (req: AuthenticatedRequest): User => {
  return req.user;
};

export const getCurrentTenantId = (req: AuthenticatedRequest): string => {
  return req.tenantId;
};

export const isAdmin = (req: AuthenticatedRequest): boolean => {
  return req.user.role === 'admin';
};

export const isLawyer = (req: AuthenticatedRequest): boolean => {
  return req.user.role === 'lawyer' || req.user.role === 'admin';
};

export const canAccessCase = (req: AuthenticatedRequest, caseData: any): boolean => {
  // المديرون والمحامون يمكنهم الوصول لجميع القضايا
  if (req.user.role === 'admin' || req.user.role === 'lawyer') {
    return true;
  }

  // المساعدون يمكنهم الوصول للقضايا المخصصة لهم
  if (req.user.role === 'assistant') {
    return caseData.assignedUsers?.includes(req.user.id);
  }

  // العملاء يمكنهم الوصول لقضاياهم فقط
  if (req.user.role === 'client') {
    return caseData.clientId === req.user.id;
  }

  return false;
};