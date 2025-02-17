"use client";

import React, { ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { signIn, useSession } from "next-auth/react";

import toast from "react-hot-toast";

interface Login {
  email: string;
  password: string;
}

export default function SignIn() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [data, setData] = useState<Login>({
    email: "",
    password: "",
  });

  const isValidEmail = (email: string) => {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return emailRegex.test(email);
  };

  const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isValidEmail(data.email)) {
      setError("حساب غير صالح");
      return;
    }
    if (!data.password || data.password.length < 8) {
      setError("يجب أن تكون كلمة السر 8 أحرف أو أرقام على الأقل");
      toast.error("خطأ في كلمة السر");
      return;
    }
    const res = await signIn("credentials", {
      redirect: false,
      email: data?.email,
      password: data?.password,
    });
    if (res?.ok) {
      
      router.push("/home"); // تحويل المستخدم بعد تسجيل الدخول
      toast.success("تم تسجيل الدخول بنجاح");
    }
    if (res?.error) {
      setError("خطأ في الحساب أو كلمة السر");
    } else {
      setError("");
    }
  };

  return (
    <section className="relative flex flex-wrap lg:h-screen lg:items-center">
      <div className="w-full px-4 py-12 sm:px-6 sm:py-16 lg:w-1/2 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-2xl font-bold sm:text-3xl">Login🔐</h1>
        </div>

        <form
          action="#"
          className="mx-auto mb-0 mt-8 max-w-md space-y-4"
          onSubmit={handleSubmit}
        >
          <div>
            <label htmlFor="email" className="sr-only">
              Email
            </label>

            <div className="relative">
              <input
                type="email"
                value={data.email}
                name="email"
                onChange={handleOnChange}
                placeholder="Email@example.com"
                required
                className="w-full rounded-lg border-gray-200 p-4 pe-12 text-sm shadow-sm"
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>

            <div className="relative">
              <input
                type="password"
                name="password"
                value={data.password}
                onChange={handleOnChange}
                placeholder="Enter password"
                required
                className="w-full rounded-lg border-gray-200 p-4 pe-12 text-sm shadow-sm"
              />
            </div>
          </div>
          <p className="text-red-600 text-[16px] mb-4">{error && error}</p>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="inline-block rounded-lg bg-blue-500 px-5 py-3 text-sm font-medium text-white"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
