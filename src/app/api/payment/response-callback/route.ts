import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Payment from "@/models/Payment";
import User from "@/models/User";
import { SUBSCRIPTION_PLANS } from "@/models/Subscription";
/**
 * Response Callback from Paymob
 * ده اللي اليوزر بيرجع عليه بعد الدفع (نجاح / فشل)
 */
export async function GET(req: Request) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);

        // Paymob بيرجع params زي success=true&merchant_order_id=...
        const success = searchParams.get("success");
        const merchantOrderId = searchParams.get("merchant_order_id");

        if (!merchantOrderId) {
            return NextResponse.json(
                { success: false, message: "merchant_order_id is missing" },
                { status: 400 }
            );
        }

        // ندور على الـ Payment
        const payment = await Payment.findOne({ merchantOrderId });
        if (!payment) {
            return NextResponse.json(
                { success: false, message: "Payment not found" },
                { status: 404 }
            );
        }

        if (success === "true") {
            payment.status = "success";
            await payment.save();

            // نحدث اشتراك المستخدم (مثلاً Standard Plan)
            const user = await User.findById(payment.userId);
            if (user) {
                const plan = SUBSCRIPTION_PLANS.free; // ممكن تخليها Dynamic حسب نوع الاشتراك
                user.firmInfo.subscription = {
                    plan,
                    startDate: new Date(),
                    endDate: new Date(
                        new Date().setMonth(new Date().getMonth() + 1) // شهر واحد
                    ),
                    isActive: true,
                };
                await user.save();
            }

            // نوجه اليوزر لصفحة success
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success`
            );
        } else {
            payment.status = "failed";
            await payment.save();

            // نوجه اليوزر لصفحة الفشل
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/subscription/failed`
            );
        }
    } catch (error) {
        console.error("Response Callback Error:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
