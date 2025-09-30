/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/payment/processed-callback/route.ts
/**
 * Paymob Processed Callback
 * يتم استدعاؤه عندما تكتمل عملية الدفع (ناجحة أو فاشلة)
 * هذا webhook من server إلى server
 */

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { SUBSCRIPTION_PLANS } from "@/constants/subscriptionPlans";
import crypto from 'crypto';
import Payment from "@/models/Payment";

export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        // استقبال البيانات من Paymob
        const callbackData = await req.json();

        console.log('📥 Processed Callback Received:', {
            id: callbackData.obj?.id,
            success: callbackData.obj?.success,
            order_id: callbackData.obj?.order?.id
        });

        // التحقق من صحة HMAC
        const isValid = verifyPaymobHMAC(callbackData);

        if (!isValid) {
            console.error('❌ Invalid HMAC signature');
            return NextResponse.json(
                { success: false, message: 'Invalid signature' },
                { status: 400 }
            );
        }

        console.log('✅ HMAC verified successfully');

        // استخراج البيانات المهمة
        const transactionData = callbackData.obj;
        const orderId = transactionData.order?.merchant_order_id;
        const transactionId = transactionData.id?.toString();
        const isSuccess = transactionData.success === true || transactionData.success === 'true';
        const amountCents = parseInt(transactionData.amount_cents || '0');
        const currency = transactionData.currency || 'EGP';

        console.log('📊 Transaction Details:', {
            orderId,
            transactionId,
            isSuccess,
            amount: amountCents / 100,
            currency
        });

        // البحث عن سجل الدفع
        const payment = await Payment.findById(orderId);

        if (!payment) {
            console.error('❌ Payment record not found:', orderId);
            return NextResponse.json(
                { success: false, message: 'Payment not found' },
                { status: 404 }
            );
        }

        // تجنب معالجة نفس الـ callback مرتين
        if (payment.callbackReceived && payment.status !== 'pending') {
            console.log('⚠️ Callback already processed');
            return NextResponse.json(
                { success: true, message: 'Already processed' },
                { status: 200 }
            );
        }

        // تحديث بيانات الدفع
        payment.gatewayTransactionId = transactionId;
        payment.gatewayResponse = callbackData;
        payment.callbackReceived = true;
        payment.status = isSuccess ? 'completed' : 'failed';

        if (isSuccess) {
            payment.completedAt = new Date();
            console.log('✅ Payment marked as completed');
        } else {
            payment.failureReason = transactionData.data?.message ||
                transactionData.error_occured ||
                'Payment failed';
            console.log('❌ Payment marked as failed:', payment.failureReason);
        }

        await payment.save();

        // إذا كان الدفع ناجح، تحديث اشتراك المستخدم
        if (isSuccess) {
            const user = await User.findById(payment.userId);

            if (user) {
                const plan = SUBSCRIPTION_PLANS[payment.planKey as keyof typeof SUBSCRIPTION_PLANS];

                if (plan) {
                    const startDate = new Date();
                    const endDate = new Date();
                    endDate.setMonth(endDate.getMonth() + 1); // اشتراك شهري

                    // تحديث بيانات الاشتراك
                    user.firmInfo.subscriptionPlan = payment.planKey;
                    user.firmInfo.maxCases = plan.maxCases;
                    //   user.firmInfo.maxEmployees = plan.maxEmployees;
                    user.firmInfo.subscription = {
                        isActive: true,
                        planName: plan.name,
                        price: plan.price,
                        startDate,
                        endDate,
                        paymentMethod: 'paymob',
                        transactionId: transactionId
                    };

                    await user.save();

                    console.log('✅ User subscription updated:', {
                        userId: user._id,
                        plan: payment.planKey,
                        maxCases: plan.maxCases
                    });

                    // يمكنك إضافة إرسال email هنا
                    // await sendSubscriptionEmail(user.email, plan.name);
                }
            } else {
                console.error('❌ User not found:', payment.userId);
            }
        }

        // Paymob يتوقع response 200
        return NextResponse.json(
            {
                success: true,
                message: 'Callback processed successfully',
                paymentStatus: payment.status
            },
            { status: 200 }
        );

    } catch (error: any) {
        console.error('💥 Processed Callback Error:', error);

        // حتى في حالة الخطأ، نرجع 200 لـ Paymob
        // لكن نسجل الخطأ
        return NextResponse.json(
            {
                success: false,
                message: 'Error processing callback',
                error: error.message
            },
            { status: 200 } // مهم: 200 حتى لا يعيد Paymob المحاولة
        );
    }
}

/**
 * التحقق من صحة HMAC من Paymob
 */
function verifyPaymobHMAC(callbackData: any): boolean {
    try {
        const hmacSecret = process.env.PAYMOB_HMAC_SECRET;

        if (!hmacSecret) {
            console.error('❌ PAYMOB_HMAC_SECRET not configured');
            return false;
        }

        const obj = callbackData.obj;
        const receivedHmac = callbackData.hmac;

        if (!obj || !receivedHmac) {
            console.error('❌ Missing obj or hmac in callback data');
            return false;
        }

        // ترتيب الحقول حسب Paymob documentation
        const concatenatedString =
            `${obj.amount_cents}` +
            `${obj.created_at}` +
            `${obj.currency}` +
            `${obj.error_occured}` +
            `${obj.has_parent_transaction}` +
            `${obj.id}` +
            `${obj.integration_id}` +
            `${obj.is_3d_secure}` +
            `${obj.is_auth}` +
            `${obj.is_capture}` +
            `${obj.is_refunded}` +
            `${obj.is_standalone_payment}` +
            `${obj.is_voided}` +
            `${obj.order?.id || obj.order}` +
            `${obj.owner}` +
            `${obj.pending}` +
            `${obj.source_data?.pan || obj.source_data_pan || ''}` +
            `${obj.source_data?.sub_type || obj.source_data_sub_type || ''}` +
            `${obj.source_data?.type || obj.source_data_type || ''}` +
            `${obj.success}`;

        // حساب HMAC
        const calculatedHmac = crypto
            .createHmac('sha512', hmacSecret)
            .update(concatenatedString)
            .digest('hex');

        const isValid = calculatedHmac === receivedHmac;

        if (!isValid) {
            console.error('❌ HMAC mismatch:', {
                calculated: calculatedHmac.substring(0, 20) + '...',
                received: receivedHmac.substring(0, 20) + '...'
            });
        }

        return isValid;

    } catch (error: any) {
        console.error('💥 HMAC Verification Error:', error);
        return false;
    }
}

// GET method للتحقق من أن الـ endpoint يعمل
export async function GET(req: NextRequest) {
    return NextResponse.json({
        message: 'Paymob Processed Callback Endpoint',
        status: 'active',
        timestamp: new Date().toISOString()
    });
}