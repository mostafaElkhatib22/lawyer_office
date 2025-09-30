/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/payment/create/route.ts
/**
 * Paymob Payment Initiation API
 * هذه الدالة مسؤولة عن خطوات بدء عملية الدفع:
 * 1. المصادقة والحصول على Token.
 * 2. تسجيل الطلب (Order) في Paymob.
 * 3. الحصول على مفتاح الدفع (Payment Key) لإنشاء رابط الدفع.
 */

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Payment from "@/models/Payment"; // النموذج الذي تم إنشاؤه سابقاً
import User from "@/models/User"; // (يفترض وجوده لربط الدفع بالمستخدم)
import { SUBSCRIPTION_PLANS } from "@/constants/subscriptionPlans"; // (يفترض وجوده لتفاصيل الباقات)

// يجب إعداد متغيرات البيئة هذه في ملف .env
const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET;
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_CARD_INTEGRATION_ID; // مثال: لبطاقات الائتمان
const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID; // رقم الـ iFrame لعرض صفحة الدفع

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export async function POST(req: NextRequest) {
    if (!PAYMOB_API_KEY || !PAYMOB_INTEGRATION_ID || !PAYMOB_IFRAME_ID) {
        console.error("❌ Paymob environment variables are missing.");
        return NextResponse.json(
            { success: false, message: 'Configuration error.' },
            { status: 500 }
        );
    }

    try {
        await dbConnect();

        const { planKey, gateway } = await req.json();

        // 1. افتراض أن المستخدم مصادق عليه (يجب استبدال هذا بمنطق الحصول على userId الفعلي)
        // في بيئة Next.js حقيقية، ستحصل على معرف المستخدم من جلسة (Session) المصادقة.
        // نستخدم هنا معرّف وهمي لغرض إكمال منطق الكود:
        const dummyUserId = "60c72b2f9c1e0e0015f8a000";
        const user = await User.findById(dummyUserId); // استرجاع بيانات المستخدم

        if (!user) {
            return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
        }

        const plan = SUBSCRIPTION_PLANS[planKey as keyof typeof SUBSCRIPTION_PLANS];

        if (!plan || plan.price === 0) {
            return NextResponse.json({ success: false, message: 'Invalid or free plan selected.' }, { status: 400 });
        }

        const amountEGP = plan.price;
        // Paymob يتعامل مع المبلغ بالوحدات الصغرى (قروش/سنتات)
        const amountCents = Math.round(amountEGP * 100);

        // 2. إنشاء سجل دفع جديد في قاعدة البيانات بحالة 'pending'
        const paymentRecord = await Payment.create({
            userId: user._id,
            planKey: planKey,
            period: 'monthly', // نفترض شهرياً
            amountCents: amountCents,
            currency: 'EGP',
            status: 'pending',
            gateway: 'paymob',
            gatewayOrderId: 'temp' // سيتم تحديثه بعد إنشاء المستند
        });

        // تحديث gatewayOrderId ليكون نفس معرّف المستند في MongoDB
        paymentRecord.gatewayOrderId = paymentRecord._id.toString();
        await paymentRecord.save();

        const merchantOrderId = paymentRecord._id.toString();
        console.log(`✨ New Payment record created: ${merchantOrderId}`);


        // =========================================================
        // الخطوة 3: الاتصال بواجهات Paymob API
        // =========================================================

        // 3.1. المصادقة والحصول على Token
        const authResponse = await fetch("https://accept.paymob.com/api/auth/tokens", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key: PAYMOB_API_KEY })
        });

        const authData = await authResponse.json();
        if (!authData.token) {
            console.error('❌ Paymob Auth Failed:', authData);
            return NextResponse.json({ success: false, message: 'Paymob authentication failed.' }, { status: 500 });
        }
        const token = authData.token;

        // 3.2. تسجيل الطلب (Order)
        const orderData = {
            auth_token: token,
            delivery_needed: 'false',
            merchant_order_id: merchantOrderId, // استخدام MongoDB ID
            amount_cents: amountCents,
            currency: 'EGP',
            items: [{
                name: plan.name, // افتراض وجود اسم عربي
                amount_cents: amountCents,
                quantity: 1,
                description: `Subscription for ${plan.name}`
            }]
        };

        const orderResponse = await fetch("https://accept.paymob.com/api/ecommerce/orders", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        const orderResult = await orderResponse.json();
        if (!orderResult.id) {
            console.error('❌ Paymob Order Registration Failed:', orderResult);
            return NextResponse.json({ success: false, message: 'Paymob order creation failed.' }, { status: 500 });
        }
        const paymobOrderId = orderResult.id;


        // 3.3. الحصول على مفتاح الدفع (Payment Key)
        const paymentKeyData = {
            auth_token: token,
            amount_cents: amountCents,
            expiration: 3600, // صالح لمدة ساعة
            order_id: paymobOrderId,
            integration_id: PAYMOB_INTEGRATION_ID,
            billing_data: {
                apartment: 'NA',
                email: user.email || 'billing@example.com',
                floor: 'NA',
                first_name: user.name || 'Test',
                street: 'NA',
                building: 'NA',
                phone_number: user.firmInfo?.phoneNumber || '01000000000',
                shipping_method: 'NA',
                postal_code: 'NA',
                city: 'NA',
                country: 'EG',
                last_name: user.name || 'User',
                state: 'NA'
            }
        };

        const paymentKeyResponse = await fetch("https://accept.paymob.com/api/acceptance/payment_keys", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentKeyData)
        });

        const paymentKeyResult = await paymentKeyResponse.json();
        if (!paymentKeyResult.token) {
            console.error('❌ Paymob Payment Key Failed:', paymentKeyResult);
            return NextResponse.json({ success: false, message: 'Paymob payment key generation failed.' }, { status: 500 });
        }
        const paymentToken = paymentKeyResult.token;


        // 4. إنشاء رابط التحويل لصفحة الدفع (iFrame)
        const paymentUrl = `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`;

        console.log(`✅ Payment URL generated for Order ${merchantOrderId}`);

        return NextResponse.json({
            success: true,
            message: 'Payment link generated successfully.',
            paymentUrl: paymentUrl,
            paymentId: merchantOrderId // معرّف الطلب في نظامك
        });

    } catch (error: any) {
        console.error('💥 Error creating payment link:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error during payment initiation.', error: error.message },
            { status: 500 }
        );
    }
}

// GET للتحقق من أن الـ endpoint يعمل
export async function GET() {
    return NextResponse.json({
        message: 'Paymob Payment Creation Endpoint',
        status: 'ready',
        required_env: ['PAYMOB_API_KEY', 'PAYMOB_CARD_INTEGRATION_ID', 'PAYMOB_IFRAME_ID']
    });
}
