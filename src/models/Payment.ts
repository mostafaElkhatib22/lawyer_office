/* eslint-disable @typescript-eslint/no-explicit-any */
import { Schema, model, Document, models } from 'mongoose';

// تعريف الواجهة لنموذج الدفع (TypeScript Interface)
// Document هي الواجهة الأساسية التي توفرها Mongoose
interface IPayment extends Document {
    userId: Schema.Types.ObjectId; // مرجع لمعرف المستخدم الذي قام بالدفع
    planKey: string; // مفتاح الباقة المشترك بها (مثل 'professional', 'basic')
    period: 'month' | 'year' | 'monthly' | 'annually' | string; // فترة الاشتراك (شهري أو سنوي)
    amountCents: number; // المبلغ المدفوع بالوحدات الصغرى (قروش)
    currency: string; // العملة (مثل 'EGP')
    status: 'pending' | 'completed' | 'failed'; // حالة عملية الدفع
    
    // بيانات خاصة بالـ Gateway
    gateway: 'paymob' | 'fawry' | 'paypal' | 'stripe' | string; // بوابة الدفع المستخدمة
    gatewayOrderId: string; // رقم الطلب الداخلي الذي تم استخدامه في Paymob (وهو نفس ObjectId لهذا الدفع)
    gatewayTransactionId?: string; // رقم العملية التي تم إتمامها في البوابة (Paymob Transaction ID)

    // بيانات الـ Webhook
    callbackReceived: boolean; // هل تم استلام إشعار الـ webhook من البوابة؟ (لمنع المعالجة المزدوجة)
    gatewayResponse?: Record<string, any>; // استجابة الـ callback الكاملة من البوابة
    failureReason?: string; // سبب الفشل في حال عدم إتمام الدفع

    completedAt?: Date; // تاريخ إتمام الدفع بنجاح
    createdAt: Date;
    updatedAt: Date;
}

// تعريف مخطط الدفع (Payment Schema)
const PaymentSchema = new Schema<IPayment>({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User', // يفترض وجود نموذج 'User'
        index: true
    },
    planKey: {
        type: String,
        required: true,
    },
    period: {
        type: String,
        enum: ['month', 'year', 'monthly', 'annually'], 
        required: true,
        default: 'month',
    },
    amountCents: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        required: true,
        default: 'EGP',
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending',
        required: true,
    },
    
    // معلومات البوابة
    gateway: {
        type: String,
        required: true,
        default: 'paymob',
    },
    // نفترض أن هذا الحقل يخزن الـ ID الخاص بالـ Payment Document نفسه
    // لكي نتمكن من البحث عنه باستخدام orderId في الـ callback (Payment.findById(orderId))
    gatewayOrderId: { 
        type: String, 
        unique: true, 
        required: true
    },
    gatewayTransactionId: {
        type: String, // رقم العملية الذي يتم إرجاعه في الـ callback
        sparse: true
    },
    
    // معلومات الـ Callback والنتيجة
    callbackReceived: {
        type: Boolean,
        default: false,
    },
    gatewayResponse: {
        type: Object, // لتخزين بيانات الـ callback JSON كاملة
    },
    failureReason: {
        type: String,
    },
    
    completedAt: {
        type: Date,
    },
}, {
    timestamps: true // تضيف createdAt و updatedAt تلقائيًا
});

// تعريف وتصدير النموذج. نستخدم models.Payment للتحقق من عدم إعادة تعريفه في Hot Reload
const Payment = (models.Payment || model<IPayment>('Payment', PaymentSchema));

export default Payment;
