/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';

const PaymentCallback = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'pending'>('loading');
  const [message, setMessage] = useState('');
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    checkPaymentStatus();
  }, []);

  const checkPaymentStatus = async () => {
    try {
      // الحصول على parameters من URL
      const urlParams = new URLSearchParams(window.location.search);
      const paymentStatus = urlParams.get('payment_status');
      const merchantOrderId = urlParams.get('merchantOrderId');
      const transactionId = urlParams.get('transactionId');
      
      console.log('Payment callback params:', { paymentStatus, merchantOrderId, transactionId });

      if (paymentStatus === 'SUCCESS' || paymentStatus === 'CAPTURED') {
        setStatus('success');
        setMessage('تمت عملية الدفع بنجاح! سيتم تفعيل اشتراكك خلال دقائق');
        
        // يمكن التحقق من الـ backend
        if (merchantOrderId) {
          setTimeout(() => {
            window.location.href = '/dashboard/subscription?success=true';
          }, 3000);
        }
      } else if (paymentStatus === 'FAILED' || paymentStatus === 'DECLINED') {
        setStatus('failed');
        setMessage('فشلت عملية الدفع. يرجى المحاولة مرة أخرى.');
      } else if (paymentStatus === 'PENDING') {
        setStatus('pending');
        setMessage('عملية الدفع قيد المعالجة. سنقوم بإبلاغك عند اكتمالها.');
      } else {
        setStatus('failed');
        setMessage('حدث خطأ غير متوقع. يرجى التواصل مع الدعم الفني.');
      }
    } catch (error) {
      console.error('Error checking payment:', error);
      setStatus('failed');
      setMessage('حدث خطأ في التحقق من حالة الدفع');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-20 h-20 text-green-500" />;
      case 'failed':
        return <XCircle className="w-20 h-20 text-red-500" />;
      case 'pending':
        return <Clock className="w-20 h-20 text-yellow-500" />;
      default:
        return <Loader2 className="w-20 h-20 text-blue-500 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'success':
        return 'تمت عملية الدفع بنجاح!';
      case 'failed':
        return 'فشلت عملية الدفع';
      case 'pending':
        return 'الدفع قيد المعالجة';
      default:
        return 'جاري التحقق من عملية الدفع...';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center">
          <div className="inline-flex items-center justify-center mb-6">
            {getStatusIcon()}
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {getStatusTitle()}
          </h2>

          <div className={`rounded-lg p-4 mb-6 border ${getStatusColor()}`}>
            <p className="text-gray-700">{message}</p>
          </div>

          <div className="space-y-3">
            {status === 'success' && (
              <>
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  الذهاب للوحة التحكم
                </button>
                <button
                  onClick={() => window.location.href = '/dashboard/subscription'}
                  className="w-full bg-white border-2 border-green-600 text-green-600 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors"
                >
                  عرض تفاصيل الاشتراك
                </button>
              </>
            )}

            {status === 'failed' && (
              <>
                <button
                  onClick={() => window.location.href = '/dashboard/subscription'}
                  className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  المحاولة مرة أخرى
                </button>
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  العودة للرئيسية
                </button>
              </>
            )}

            {status === 'pending' && (
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="w-full bg-yellow-600 text-white py-3 rounded-lg font-semibold hover:bg-yellow-700 transition-colors"
              >
                العودة للوحة التحكم
              </button>
            )}

            {status === 'loading' && (
              <div className="text-gray-500 text-sm">
                يرجى الانتظار...
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 text-sm text-gray-600">
            <p>في حالة وجود أي استفسار، يرجى التواصل معنا:</p>
            <p className="font-semibold mt-1">support@lawoffice.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCallback;