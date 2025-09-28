/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaSearch,
  FaEllipsisV,
  FaTimes,
  FaSpinner,
} from "react-icons/fa";

// تعريف واجهة بيانات الموكل
interface Client {
  _id: string;
  name: string;
  email: string;
  phone: string;
  caseCount: number;
}

// مكون تأكيد الحذف - محسن بـ memo
interface DeleteModalProps {
  clientName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
  error: string | null;
}

const DeleteConfirmationModal = memo(({
  clientName,
  onConfirm,
  onCancel,
  isLoading,
  error,
}: DeleteModalProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-lg transform scale-100 transition-transform duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-red-600">تأكيد الحذف</h3>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-400 transition-colors"
            aria-label="إغلاق"
          >
            <FaTimes />
          </button>
        </div>
        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300 mb-2">
            هل أنت متأكد من حذف الموكل التالي؟
          </p>
          <p className="font-bold text-lg text-gray-900 dark:text-gray-100">
            {clientName}
          </p>
          <p className="text-red-500 text-sm mt-4">
            سيؤدي هذا إلى حذف جميع قضاياه وملفاته بشكل نهائي.
          </p>
        </div>
        <div className="flex justify-end space-x-3 space-x-reverse">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            disabled={isLoading}
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <FaSpinner className="inline-block animate-spin ml-2" />
                جاري الحذف...
              </>
            ) : (
              "تأكيد الحذف"
            )}
          </button>
        </div>
        {error && (
          <p className="text-red-500 text-sm mt-4 text-center">{error}</p>
        )}
      </div>
    </div>
  );
});

DeleteConfirmationModal.displayName = "DeleteConfirmationModal";

// مكون صف الجدول - محسن بـ memo
interface ClientRowProps {
  client: Client;
  isDropdownOpen: boolean;
  onToggleDropdown: () => void;
  onEdit: (clientId: string) => void;
  onDelete: (clientId: string, clientName: string) => void;
}

const ClientRow = memo(({ 
  client, 
  isDropdownOpen, 
  onToggleDropdown, 
  onEdit, 
  onDelete 
}: ClientRowProps) => {
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // إغلاق القائمة المنسدلة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (isDropdownOpen) {
          onToggleDropdown();
        }
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen, onToggleDropdown]);

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {client.name}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {client.email}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {client.phone}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-100">
          {client.caseCount}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
        <button
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          onClick={onToggleDropdown}
          aria-label="خيارات الإجراءات"
        >
          <FaEllipsisV className="text-gray-500 dark:text-gray-400" />
        </button>
        {isDropdownOpen && (
          <div
            ref={dropdownRef}
            className="absolute left-0 mt-2 w-40 bg-white dark:bg-gray-700 rounded-lg shadow-lg z-10 border border-gray-200 dark:border-gray-600 overflow-hidden divide-y divide-gray-100 dark:divide-gray-600 animate-fade-in"
            style={{ transformOrigin: "top left" }}
          >
            <Link href={`/dashboard/clients/edit/${client._id}`}>
              <button
                onClick={() => {
                  onEdit(client._id);
                  onToggleDropdown();
                }}
                className="w-full text-right flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900 transition-colors"
              >
                <FaEdit className="ml-3 text-indigo-600" />
                <span>تعديل</span>
              </button>
            </Link>
            <button
              onClick={() => {
                onDelete(client._id, client.name);
                onToggleDropdown();
              }}
              className="w-full text-right flex items-center px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 transition-colors"
            >
              <FaTrash className="ml-3" />
              <span>حذف</span>
            </button>
          </div>
        )}
      </td>
    </tr>
  );
});

ClientRow.displayName = "ClientRow";

// مكون شريط البحث - محسن بـ memo
interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const SearchBar = memo(({ searchTerm, onSearchChange }: SearchBarProps) => {
  return (
    <div className="relative flex-grow">
      <input
        type="text"
        placeholder="ابحث عن موكل..."
        className="p-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors pr-12 w-full"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <FaSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
    </div>
  );
});

SearchBar.displayName = "SearchBar";

// مكون حالة التحميل - محسن بـ memo
const LoadingState = memo(() => (
  <div className="text-center py-12">
    <FaSpinner className="inline-block animate-spin text-indigo-600 dark:text-indigo-400 text-4xl" />
    <p className="text-gray-500 dark:text-gray-400 mt-4">
      جارٍ تحميل البيانات...
    </p>
  </div>
));

LoadingState.displayName = "LoadingState";

// مكون حالة الخطأ - محسن بـ memo
interface ErrorStateProps {
  error: string;
}

const ErrorState = memo(({ error }: ErrorStateProps) => (
  <div className="text-center py-8 bg-red-50 dark:bg-red-900 rounded-xl mb-6 border border-red-200 dark:border-red-700">
    <p className="text-red-600 dark:text-red-200 font-medium">
      {error}
    </p>
  </div>
));

ErrorState.displayName = "ErrorState";

// مكون حالة عدم وجود نتائج - محسن بـ memo
const EmptyState = memo(() => (
  <div className="text-center py-12 bg-gray-100 dark:bg-gray-700 rounded-xl">
    <div className="flex flex-col items-center justify-center">
      <FaSearch className="text-5xl text-gray-300 dark:text-gray-500 mb-3" />
      <p className="text-lg text-gray-500 dark:text-gray-300">
        لا يوجد موكلون يطابقون معيار البحث.
      </p>
      <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
        جرب مصطلحات بحث مختلفة أو قم بإضافة موكل جديد.
      </p>
    </div>
  </div>
));

EmptyState.displayName = "EmptyState";

// المكون الرئيسي لجدول الموكلين - محسن
const ClientsUI = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    clientId: "",
    clientName: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // دالة محسنة لجلب البيانات من الـ API
  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/clients", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success) {
        setClients(data.data || []);
      } else {
        setError(data.message || "فشل في جلب قائمة الموكلين.");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("حدث خطأ غير متوقع أثناء الاتصال بالخادم.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // دالة محسنة لحذف موكل
  const handleDelete = useCallback(async (clientId: string) => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        // إزالة الموكل من القائمة محلياً لتحسين الأداء
        setClients(prevClients => 
          prevClients.filter(client => client._id !== clientId)
        );
        console.log("تم الحذف بنجاح!");
      } else {
        setError(data.message || "فشل في عملية الحذف.");
      }
    } catch (err) {
      console.error("Deletion error:", err);
      setError("حدث خطأ أثناء الاتصال بالخادم للحذف.");
    } finally {
      setIsDeleting(false);
      setDeleteModal({ isOpen: false, clientId: "", clientName: "" });
    }
  }, []);

  // دالة للتعديل
  const handleEdit = useCallback((clientId: string) => {
    console.log(`جارٍ تعديل الموكل ذي المعرّف: ${clientId}`);
  }, []);

  // فتح نموذج تأكيد الحذف
  const openDeleteModal = useCallback((clientId: string, clientName: string) => {
    setDeleteModal({ isOpen: true, clientId, clientName });
    setOpenDropdownId(null);
  }, []);

  // إغلاق نموذج الحذف
  const closeDeleteModal = useCallback(() => {
    setDeleteModal({ isOpen: false, clientId: "", clientName: "" });
    setError(null);
  }, []);

  // معالج تغيير شريط البحث
  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  // معالج تبديل القائمة المنسدلة
  const handleToggleDropdown = useCallback((clientId: string) => {
    setOpenDropdownId(prevId => prevId === clientId ? null : clientId);
  }, []);

  // جلب البيانات عند تحميل المكون
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // تصفية الموكلين بناءً على شريط البحث - محسنة بـ useMemo
  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return clients;
    
    const searchLower = searchTerm.toLowerCase();
    return clients.filter((client) =>
      client?.name?.toLowerCase().includes(searchLower) ||
      client?.email?.toLowerCase().includes(searchLower) ||
      client?.phone?.includes(searchTerm)
    );
  }, [clients, searchTerm]);

  // محسن - تجميع حالات الرسم المختلفة
  const renderContent = useMemo(() => {
    if (isLoading) {
      return <LoadingState />;
    }

    if (error) {
      return <ErrorState error={error} />;
    }

    if (filteredClients.length === 0) {
      return <EmptyState />;
    }

    return (
      <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th
                scope="col"
                className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider rounded-tr-xl"
              >
                الاسم
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                البريد الإلكتروني
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                رقم الهاتف
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                عدد القضايا
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider rounded-tl-xl"
              >
                إجراءات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredClients.map((client) => (
              <ClientRow
                key={client._id}
                client={client}
                isDropdownOpen={openDropdownId === client._id}
                onToggleDropdown={() => handleToggleDropdown(client._id)}
                onEdit={handleEdit}
                onDelete={openDeleteModal}
              />
            ))}
          </tbody>
        </table>
      </div>
    );
  }, [isLoading, error, filteredClients, openDropdownId, handleToggleDropdown, handleEdit, openDeleteModal]);

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 text-gray-800 font-sans transition-colors duration-300 dark:from-gray-900 dark:to-gray-800 dark:text-gray-200 p-4 sm:p-8 flex flex-col items-center"
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-10 w-full max-w-6xl shadow-xl transition-colors duration-300">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-indigo-700 dark:text-indigo-400 transition-colors duration-300">
              قائمة الموكلين
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              إدارة قاعدة بيانات موكليك بسهولة ({filteredClients.length} موكل)
            </p>
          </div>
          <div className="flex items-center space-x-3 space-x-reverse w-full sm:w-auto">
            <SearchBar 
              searchTerm={searchTerm} 
              onSearchChange={handleSearchChange}
            />
            <Link href="/dashboard/clients/add-client">
              <button className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white font-bold py-3 px-5 rounded-xl shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center whitespace-nowrap">
                <FaPlus className="ml-2" />
                <span>إضافة موكل</span>
              </button>
            </Link>
          </div>
        </div>

        {renderContent}
      </div>

      {deleteModal.isOpen && (
        <DeleteConfirmationModal
          clientName={deleteModal.clientName}
          onConfirm={() => handleDelete(deleteModal.clientId)}
          onCancel={closeDeleteModal}
          isLoading={isDeleting}
          error={error}
        />
      )}
    </div>
  );
};

export default memo(ClientsUI);