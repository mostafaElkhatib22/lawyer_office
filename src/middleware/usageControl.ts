/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextApiRequest, NextApiResponse } from "next";
import SubscriptionModel, { SubscriptionDocument, SubscriptionPlan, UsageStats } from "@/models/Subscription";
import { getTenantDB } from "@/utils/database";

export interface LimitCheckResult {
  allowed: boolean;
  remaining?: number;
  limit?: number;
  currentUsage?: number;
  plan?: SubscriptionPlan;
  error?: string;
}

export interface UsageUpdateResult {
  success: boolean;
  subscription?: SubscriptionDocument;
  error?: string;
}

export interface ExtendedApiRequest extends NextApiRequest {
  user: {
    id: string;
    tenantId: string;
    email: string;
    role: string;
  };
  models?: Record<string, any>;
  resourceLimit?: LimitCheckResult;
  resourceAmount?: number;
}

type ResourceType = keyof UsageStats;

export class UsageManager {

  // التحقق من حد المورد
  static async checkLimit(
    userId: string,
    resource: ResourceType,
    amount: number = 1
  ): Promise<LimitCheckResult> {
    try {
      const subscription = await SubscriptionModel.findOne({
        userId,
        isActive: true,
        endDate: { $gt: new Date() }
      });

      if (!subscription) return { allowed: false, error: "لا يوجد اشتراك فعال" };

      const limit = subscription.limits[resource];
      const currentUsage = subscription.usage[resource];

      if (limit === -1) return { allowed: true, remaining: -1 };

      const remaining = limit - currentUsage;
      const allowed = remaining >= amount;

      return { allowed, remaining, limit, currentUsage, plan: subscription.plan };
    } catch (error) {
      console.error("خطأ في التحقق من الحد:", error);
      return { allowed: false, error: (error as Error).message };
    }
  }

  // تحديث الاستخدام
  static async updateUsage(
    userId: string,
    resource: ResourceType,
    amount: number
  ): Promise<UsageUpdateResult> {
    try {
      const subscription = await SubscriptionModel.findOneAndUpdate(
        { userId, isActive: true },
        { $inc: { [`usage.${resource}`]: amount } },
        { new: true }
      );

      if (!subscription) return { success: false, error: "لا يوجد اشتراك فعال" };
      return { success: true, subscription };
    } catch (error) {
      console.error("خطأ في تحديث الاستخدام:", error);
      return { success: false, error: (error as Error).message };
    }
  }

  // حساب مساحة التخزين
  static async calculateStorageUsage(tenantId: string): Promise<number> {
    try {
      const  conn  = await getTenantDB(tenantId);
      const Document = conn.model("Document");
      const documents = await Document.find({}, "fileSize").lean();

      const totalSize = documents.reduce((total: any, doc: any) => total + (doc.fileSize || 0), 0);
      return Math.round(totalSize / (1024 * 1024)); // تحويل لميجابايت
    } catch (error) {
      console.error("خطأ في حساب مساحة التخزين:", error);
      return 0;
    }
  }

  // تحديث الإحصائيات الفعلية
  static async refreshUsageStats(userId: string, tenantId: string): Promise<UsageStats> {
    try {
      const  conn  = await getTenantDB(tenantId);

      const [casesCount, clientsCount, documentsCount, storageUsage] = await Promise.all([
        conn.model("Case").countDocuments(),
        conn.model("Client").countDocuments(),
        conn.model("Document").countDocuments(),
        this.calculateStorageUsage(tenantId)
      ]);

      const usage: UsageStats = {
        cases: casesCount,
        clients: clientsCount,
        documents: documentsCount,
        storage: storageUsage,
        users: 1
      };

      await SubscriptionModel.findOneAndUpdate(
        { userId, isActive: true },
        { usage }
      );

      return usage;
    } catch (error) {
      console.error("خطأ في تحديث الإحصائيات:", error);
      throw error;
    }
  }
}

// Middleware للتحقق من الحدود قبل أي عملية
export const checkResourceLimit = (resource: ResourceType) => {
  return async (
    req: ExtendedApiRequest,
    res: NextApiResponse,
    next: () => void
  ): Promise<void> => {
    try {
      const userId = req.user.id;
      let amount = req.resourceAmount || 1;

      // الملفات: احسب حجم الملف بالميجابايت
      if (resource === "storage" && (req as any).file) {
        amount = Math.ceil((req as any).file.size / (1024 * 1024));
      }

      const limitCheck = await UsageManager.checkLimit(userId, resource, amount);

      if (!limitCheck.allowed) {
        return res.status(403).json({
          error: "تم تجاوز الحد المسموح",
          message: `لقد وصلت للحد الأقصى للخطة ${limitCheck.plan}`,
          resource,
          limit: limitCheck.limit,
          currentUsage: limitCheck.currentUsage,
          upgradeRequired: true
        });
      }

      req.resourceLimit = limitCheck;
      next();
    } catch (error) {
      console.error("Middleware checkResourceLimit error:", error);
      res.status(500).json({ error: "خطأ في التحقق من الحدود" });
    }
  };
};

// Middleware لتحديث الاستخدام بعد نجاح العملية
export const updateResourceUsage = (resource: ResourceType) => {
  return async (
    req: ExtendedApiRequest,
    res: NextApiResponse,
    next: () => void
  ): Promise<void> => {
    const originalJson = res.json;

    res.json = function (data: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        UsageManager.updateUsage(req.user.id, resource, req.resourceAmount || 1)
          .catch(err => console.error("خطأ في تحديث الاستخدام:", err));
      }
      return originalJson.call(this, data);
    };

    next();
  };
};
