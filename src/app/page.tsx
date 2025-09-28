/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-page-custom-font */
"use client";
import {
  CalendarPlus,
  ClipboardList,
  ClipboardPlus,
  Gavel,
  ShieldPlus,
  UserRound,
  ArrowRight,
  Cloud,
  Lock,
  Zap,
  Users,
  BarChart3,
  CheckCircle2,
} from "lucide-react";
import Image from "next/image";
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

// تأثيرات الحركة
const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5, ease: "easeOut" },
};

const slideInLeft = {
  initial: { opacity: 0, x: -60 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
};

const slideInRight = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
};

function HomePage() {
  const MotionLink = motion(Link);

  const features = [
    {
      icon: <MdDashboard size={40} />,
      title: "لوحة تحكم",
      description: "لوحة تحكم شاملة لمتابعة جميع نشاطات المكتب",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: <Gavel size={40} />,
      title: "إدارة الدعاوى",
      description: "تنظيم ومتابعة جميع الدعاوى والقضايا",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: <UserRound size={40} />,
      title: "إدارة الموكلين",
      description: "حفظ بيانات الموكلين ومتابعة قضاياهم",
      color: "from-green-500 to-teal-500",
    },
    {
      icon: <ShieldPlus size={40} />,
      title: "إدارة الجلسات",
      description: "تنظيم مواعيد الجلسات وإشعاراتها",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: <ClipboardPlus size={40} />,
      title: "التقارير",
      description: "تقارير شاملة عن أداء المكتب والموظفين",
      color: "from-indigo-500 to-purple-500",
    },
  ];

  const advantages = [
    {
      icon: <Cloud className="text-blue-500" size={32} />,
      title: "الحوسبة السحابية",
      description: "الوصول إلى بياناتك من أي مكان وفي أي وقت",
    },
    {
      icon: <Lock className="text-green-500" size={32} />,
      title: "أمان متكامل",
      description: "بياناتك محمية بأحدث تقنيات التشفير",
    },
    {
      icon: <Zap className="text-yellow-500" size={32} />,
      title: "سرعة فائقة",
      description: "أداء سريع وسلس لتجربة استخدام ممتازة",
    },
    {
      icon: <Users className="text-purple-500" size={32} />,
      title: "عمل جماعي",
      description: "إدارة فرق العمل وتوزيع المهام بسهولة",
    },
    {
      icon: <BarChart3 className="text-red-500" size={32} />,
      title: "تحليلات متقدمة",
      description: "تقارير وتحليلات تفصيلية عن أداء المكتب",
    },
    {
      icon: <CheckCircle2 className="text-teal-500" size={32} />,
      title: "سهولة الاستخدام",
      description: "واجهة مستخدم بديهية وسهلة التعلم",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-800">
      {/* الهيدر الرئيسي */}
      <header className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              نظام إدارة مكاتب المحاماة
              <span className="block text-3xl md:text-4xl font-light mt-2">
                الحل المتكامل لإدارة ممارستك القانونية
              </span>
            </h1>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              نظام متكامل يسهل إدارة المهام اليومية، متابعة القضايا، وتنظيم
              الجلسات بمهنية وكفاءة عالية
            </p>

            <MotionLink
              href="/auth/login"
              whileHover={{ scale: 1.1 }}
              className="px-8 py-3 bg-white text-blue-600 font-bold rounded-xl shadow-lg hover:bg-gray-100"
            >
              ابدأ الآن
            </MotionLink>
          </motion.div>
        </div>

        {/* موجات تصميمية */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 320"
            className="w-full"
          >
            <path
              fill="#ffffff"
              fillOpacity="1"
              d="M0,224L48,213.3C96,203,192,181,288,186.7C384,192,480,224,576,224C672,224,768,192,864,165.3C960,139,1056,117,1152,128C1248,139,1344,181,1392,202.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            ></path>
          </svg>
        </div>
      </header>

      {/* قسم المميزات الرئيسية */}
      <section className="py-20 relative -mt-1 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
              المحامي الذكي
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              نظام إلكتروني متكامل صُمم خصيصًا لإدارة مكاتب المحاماة بكفاءة
              واحترافية
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
            >
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-slate-800 dark:to-purple-900 p-8 rounded-2xl shadow-lg">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 text-right">
                  إدارة متكاملة وشاملة
                </h3>
                <ul className="space-y-4 text-right">
                  <li className="flex items-center justify-end gap-3 text-gray-700 dark:text-gray-300">
                    <span>تسجيل وإدارة الموظفين وتوزيع المهام</span>
                    <CheckCircle2
                      size={20}
                      className="text-green-500 flex-shrink-0"
                    />
                  </li>
                  <li className="flex items-center justify-end gap-3 text-gray-700 dark:text-gray-300">
                    <span>تنظيم مواعيد العملاء والجلسات</span>
                    <CheckCircle2
                      size={20}
                      className="text-green-500 flex-shrink-0"
                    />
                  </li>
                  <li className="flex items-center justify-end gap-3 text-gray-700 dark:text-gray-300">
                    <span>متابعة الدعاوى والقضايا بشكل منظم</span>
                    <CheckCircle2
                      size={20}
                      className="text-green-500 flex-shrink-0"
                    />
                  </li>
                  <li className="flex items-center justify-end gap-3 text-gray-700 dark:text-gray-300">
                    <span>تخزين آمن للبيانات على السحابة</span>
                    <CheckCircle2
                      size={20}
                      className="text-green-500 flex-shrink-0"
                    />
                  </li>
                </ul>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-gradient-to-tr from-blue-500 to-purple-600 rounded-2xl p-1 shadow-xl">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 h-80 flex items-center justify-center">
                  <div className="text-center">
                    <Image
                      src="/WhatsApp Image 2025-09-27 at 13.08.46_2a9a58c2.jpg"
                      alt="نظام المحامي الذكي"
                      width={800}
                      height={800}
                      className="object-cover rounded-xl mx-auto shadow-lg"
                    />
                    <p className="mt-4 text-gray-600 dark:text-gray-300">
                      واجهة نظام المحامي الذكي
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* قسم الميزات */}
      <section className="py-20 bg-slate-50 dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
              الميزات الرئيسية
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              اكتشف كيف يمكن لنظام المحامي الذكي تحويل طريقة عملك
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {advantages.map((advantage, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-slate-700 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 text-center"
              >
                <div className="bg-blue-50 dark:bg-slate-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  {advantage.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                  {advantage.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {advantage.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* قسم الوحدات */}
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
              الوحدات الرئيسية
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              نظام متكامل يغطي جميع احتياجات مكتب المحاماة
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group text-center"
                whileHover={{ y: -10 }}
              >
                <div
                  className={`bg-gradient-to-r ${feature.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* قسم الأمان */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold mb-4">
                خصوصية تامة وأمان متكامل
              </h2>
              <p className="text-xl mb-6 opacity-90">
                نعلم أن بياناتك هي ثروتك، لذلك حرصنا على توفير أعلى مستويات
                الأمان والخصوصية لبياناتك.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-green-300" />
                  <span>
                    خوادم خاصة بكل عميل في أفضل مراكز البيانات العالمية
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-green-300" />
                  <span>تشفير متقدم لجميع البيانات المخزنة والمنقولة</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-green-300" />
                  <span>نسخ احتياطية تلقائية لمنع فقدان البيانات</span>
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
              className="flex justify-center"
            >
              <div className="relative">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
                  <Lock size={80} className="mx-auto text-white opacity-80" />
                  <h3 className="text-2xl font-bold text-center mt-4">
                    حماية شاملة
                  </h3>
                  <p className="text-center opacity-90 mt-2">
                    بياناتك في أيدٍ أمينة
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* دعوة للعمل */}
      <section className="py-16 bg-slate-100 dark:bg-slate-800">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
              جاهز لتحويل مكتبك إلى العصر الرقمي؟
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              انضم إلى مئات مكاتب المحاماة التي تستفيد من نظام المحامي الذكي
              لإدارة أعمالها
            </p>

            <MotionLink
              href="/auth/login"
              whileHover={{ scale: 1.1 }}
              className="px-8 py-3 bg-white text-blue-600 font-bold rounded-xl shadow-lg hover:bg-gray-100"
            >
              ابدأ الآن
            </MotionLink>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

// رمز أيقونة لوحة التحكم
const MdDashboard = ({ size }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
  </svg>
);

export default HomePage;
