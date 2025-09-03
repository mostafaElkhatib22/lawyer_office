/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";

const API_BASE_URL = "/api/clients";

export default function EditClientPage() {
  const [client, setClient] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams(); // 👈 هنا بنجيب الـ id من الـ URL
  const clientId = params?.id as string;

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/${clientId}`, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();
        setClient({
          name: data.singleClient.name || "",
          email: data.singleClient.email || "",
          phone: data.singleClient.phone || "",
          address: data.singleClient.address || "",
        });
        setLoading(false);
      } catch (err) {
        setError("فشل في تحميل بيانات الموكل.");
        setLoading(false);
      }
    };

    if (clientId) {
      fetchClientData();
    } else {
      setLoading(false);
      setError("لم يتم العثور على مُعرف الموكل.");
    }
  }, [clientId, session?.user?.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setClient((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/${clientId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(client),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "فشل في تحديث بيانات الموكل.");
      }

      setMessage("تم تحديث بيانات الموكل بنجاح!");
      setLoading(false);

      // ممكن ترجع المستخدم لصفحة العملاء بعد الحفظ
      // router.push("/clients");
    } catch (err: any) {
      setError(err.message || "حدث خطأ غير متوقع.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-2xl w-full">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-6 text-center">
          تعديل بيانات الموكل
        </h1>

        {loading && !error && !message && (
          <p className="text-center text-gray-800 dark:text-gray-200">
            جاري التحميل...
          </p>
        )}

        {message && (
          <div className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 p-3 rounded-lg mb-4 text-center">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 p-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        {!loading && !error && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium">
                الاسم الكامل
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={client.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border px-4 py-2"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={client.email}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border px-4 py-2"
                required
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium">
                رقم الهاتف
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={client.phone}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border px-4 py-2"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium">
                العنوان
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={client.address}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border px-4 py-2"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
