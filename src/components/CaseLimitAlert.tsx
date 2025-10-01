/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Sparkles, X } from 'lucide-react';

interface CaseLimitAlertProps {
  show: boolean;
  onClose: () => void;
  currentCount: number;
  maxCount: number;
  onUpgrade: () => void;
}

const CaseLimitAlert: React.FC<CaseLimitAlertProps> = ({
  show,
  onClose,
  currentCount,
  maxCount,
  onUpgrade
}) => {
  const [isVisible, setIsVisible] = useState(show);
  const percentage = Math.round((currentCount / maxCount) * 100);
  const remaining = maxCount - currentCount;
  const isAtLimit = remaining <= 0;
  const isNearLimit = remaining <= 10 && remaining > 0;

  useEffect(() => {
    setIsVisible(show);
  }, [show]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className={`p-6 ${isAtLimit ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-orange-400 to-yellow-400'} text-white relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">
                {isAtLimit ? 'وصلت للحد الأقصى!' : 'تنبيه: أوشكت على النهاية'}
              </h3>
              <p className="text-sm opacity-90">
                {isAtLimit ? 'لا يمكنك إضافة دعاوى جديدة' : `متبقي ${remaining} دعاوى فقط`}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white/30 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-white h-full transition-all duration-500 rounded-full shadow-lg"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-white/90 mt-2">
            {currentCount} من {maxCount} دعوى ({percentage}%)
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="mb-6">
            <h4 className="font-bold text-gray-900 mb-2">
              {isAtLimit ? 'ماذا الآن؟' : 'لماذا يجب عليك الترقية؟'}
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>{isAtLimit ? 'استمر في إدارة دعاويك بدون قيود' : 'تجنب التوقف المفاجئ عن العمل'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>الوصول لمميزات متقدمة وتقارير مفصلة</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>دعم فني مخصص على مدار الساعة</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>إضافة موظفين وتوزيع الأعمال بكفاءة</span>
              </li>
            </ul>
          </div>

          {/* Recommended Plan */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-4 border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h5 className="font-bold text-gray-900 mb-1">الباقة الموصى بها</h5>
                <p className="text-sm text-gray-600 mb-2">الباقة الأساسية - 1000 جنيه/شهر</p>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="bg-white px-2 py-1 rounded">500 دعوى</span>
                  <span className="bg-white px-2 py-1 rounded">5 موظفين</span>
                  <span className="bg-white px-2 py-1 rounded">دعم مميز</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={onUpgrade}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              عرض الباقات والترقية الآن
            </button>
            
            {!isAtLimit && (
              <button
                onClick={onClose}
                className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                تذكيرني لاحقاً
              </button>
            )}
          </div>

          {/* Contact Support */}
          <p className="text-xs text-center text-gray-500 mt-4">
            تحتاج مساعدة؟ تواصل معنا على{' '}
            <a href="mailto:support@lawoffice.com" className="text-blue-600 hover:underline">
              support@lawoffice.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CaseLimitAlert;