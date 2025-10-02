/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/api/reports/financial/route.ts
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import Client from "@/models/Client";
import Case from "@/models/Case";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "يجب تسجيل الدخول أولاً" },
        { status: 401 }
      );
    }

    // التحقق من الصلاحيات
    if (
      session.user.accountType !== "owner" &&
      !session.user.permissions?.financial?.viewReports &&
      !session.user.permissions?.reports?.viewFinancial
    ) {
      return NextResponse.json(
        { success: false, message: "ليس لديك صلاحية لعرض التقارير المالية" },
        { status: 403 }
      );
    }

    await dbConnect();

    // الحصول على معرف المكتب
    const ownerId = session.user.accountType === "owner" 
      ? session.user.id 
      : session.user.ownerId;

    // الحصول على تواريخ الفلترة من query parameters
    const searchParams = req.nextUrl.searchParams;
    const dateFrom = searchParams.get('from');
    const dateTo = searchParams.get('to');

    // إنشاء فلتر التاريخ
    let dateFilter = {};
    if (dateFrom || dateTo) {
      dateFilter = {
        createdAt: {
          ...(dateFrom && { $gte: new Date(dateFrom) }),
          ...(dateTo && { $lte: new Date(dateTo + 'T23:59:59.999Z') })
        }
      };
    }

    // جلب جميع القضايا مع معلومات العملاء
    const cases = await Case.find({
      createdBy: ownerId,
      ...dateFilter
    })
    .populate('client', 'name email phone')
    .lean();

    // حساب الإحصائيات المالية
    let totalRevenue = 0;
    let totalPaid = 0;
    let totalRemaining = 0;

    const clientsFinancialData = [];
    const clientsMap = new Map();

    for (const caseItem of cases) {
      const clientId = caseItem.client?._id?.toString();
      
      if (!clientId) continue;

      const fees = caseItem.financialInfo?.fees || 0;
      const paid = caseItem.financialInfo?.paidAmount || 0;
      const remaining = fees - paid;

      totalRevenue += fees;
      totalPaid += paid;
      totalRemaining += remaining;

      // تجميع البيانات حسب العميل
      if (!clientsMap.has(clientId)) {
        clientsMap.set(clientId, {
          clientId: clientId,
          clientName: caseItem.client.name,
          clientEmail: caseItem.client.email,
          clientPhone: caseItem.client.phone,
          cases: [],
          totalFees: 0,
          totalPaid: 0,
          totalRemaining: 0
        });
      }

      const clientData = clientsMap.get(clientId);
      clientData.cases.push({
        caseId: caseItem._id,
        caseNumber: caseItem.caseNumber,
        caseTitle: caseItem.title,
        fees: fees,
        paidAmount: paid,
        remainingAmount: remaining,
        paymentStatus: remaining === 0 ? 'paid' : (paid > 0 ? 'partial' : 'unpaid'),
        payments: caseItem.financialInfo?.payments || [],
        lastPaymentDate: caseItem.financialInfo?.payments?.length > 0 
          ? caseItem.financialInfo.payments[caseItem.financialInfo.payments.length - 1].date 
          : null
      });

      clientData.totalFees += fees;
      clientData.totalPaid += paid;
      clientData.totalRemaining += remaining;
    };

    // تحويل Map إلى Array
    const clientsArray = Array.from(clientsMap.values()).map(client => ({
      ...client,
      paymentStatus: client.totalRemaining === 0 ? 'paid' : (client.totalPaid > 0 ? 'partial' : 'unpaid')
    }));

    // حساب عدد العملاء حسب حالة الدفع
    const paidClients = clientsArray.filter(c => c.paymentStatus === 'paid').length;
    const partialClients = clientsArray.filter(c => c.paymentStatus === 'partial').length;
    const unpaidClients = clientsArray.filter(c => c.paymentStatus === 'unpaid').length;

    // الإحصائيات النهائية
    const summary = {
      totalRevenue: totalRevenue,
      totalPaid: totalPaid,
      totalRemaining: totalRemaining,
      netIncome: totalPaid, // يمكن تعديله ليشمل المصروفات
      totalClients: clientsArray.length,
      paidClients: paidClients,
      partialClients: partialClients,
      unpaidClients: unpaidClients,
      totalCases: cases.length
    };

    return NextResponse.json({
      success: true,
      data: {
        summary,
        clients: clientsArray,
        dateRange: { from: dateFrom, to: dateTo }
      }
    });

  } catch (error: any) {
    console.error("Error fetching financial reports:", error);
    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء جلب التقارير المالية" },
      { status: 500 }
    );
  }
}