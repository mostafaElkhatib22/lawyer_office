/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Link from "next/link";
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  memo,
} from "react";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaSearch,
  FaEllipsisV,
  FaTimes,
  FaSpinner,
  FaTh,
  FaList,
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

const DeleteConfirmationModal = memo(
  ({ clientName, onConfirm, onCancel, isLoading, error }: DeleteModalProps) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-300 dark:border-gray-700 transform scale-100 transition-transform duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-red-600 dark:text-red-400">
              تأكيد الحذف
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="إغلاق"
            >
              <FaTimes />
            </button>
          </div>
          <div className="mb-6">
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              هل أنت متأكد من حذف الموكل التالي؟
            </p>
            <p className="font-bold text-lg text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 p-3 rounded-lg border">
              {clientName}
            </p>
            <p className="text-red-600 dark:text-red-400 text-sm mt-4 flex items-center gap-2">
              <FaTimes className="text-xs" />
              سيؤدي هذا إلى حذف جميع قضاياه وملفاته بشكل نهائي.
            </p>
          </div>
          <div className="flex justify-end space-x-3 space-x-reverse">
            <button
              onClick={onCancel}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 font-medium border border-gray-300 dark:border-gray-600"
              disabled={isLoading}
            >
              إلغاء
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-200 disabled:opacity-50 font-medium flex items-center gap-2 shadow-lg shadow-red-600/25"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  جاري الحذف...
                </>
              ) : (
                "تأكيد الحذف"
              )}
            </button>
          </div>
          {error && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm text-center">
                {error}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }
);

DeleteConfirmationModal.displayName = "DeleteConfirmationModal";

// مكون بطاقة العميل للعرض الشبكي
interface ClientCardProps {
  client: Client;
  onEdit: (clientId: string) => void;
  onDelete: (clientId: string, clientName: string) => void;
}

const ClientCard = memo(({ client, onEdit, onDelete }: ClientCardProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 group hover:scale-[1.02]">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12  bg-blue-500  rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">
              {client.name.charAt(0)}
            </span>
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
              {client.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {client.email}
            </p>
          </div>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
          >
            <FaEllipsisV />
          </button>

          {isDropdownOpen && (
            <div className="absolute left-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-10 overflow-hidden animate-fade-in">
              <button
                onClick={() => {
                  onEdit(client._id);
                  setIsDropdownOpen(false);
                }}
                className="w-full text-right flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border-b border-gray-100 dark:border-gray-700"
              >
                <FaEdit className="text-blue-600 text-sm" />
                <span>تعديل</span>
              </button>
              <button
                onClick={() => {
                  onDelete(client._id, client.name);
                  setIsDropdownOpen(false);
                }}
                className="w-full text-right flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-600 hover:bg-red-500 dark:hover:bg-red-900/20 transition-colors"
              >
                <FaTrash className="text-sm" />
                <span>حذف</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            رقم الهاتف
          </span>
          <span className="font-medium text-gray-900 dark:text-white">
            {client.phone}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
          <span className="text-sm text-blue-600 dark:text-blue-400">
            عدد القضايا
          </span>
          <span className="font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-blue-900 px-3 py-1 rounded-full text-sm">
            {client.caseCount}
          </span>
        </div>
      </div>
    </div>
  );
});

ClientCard.displayName = "ClientCard";

// مكون صف الجدول للعرض القائمي
interface ClientRowProps {
  client: Client;
  isDropdownOpen: boolean;
  onToggleDropdown: () => void;
  onEdit: (clientId: string) => void;
  onDelete: (clientId: string, clientName: string) => void;
}

const ClientRow = memo(
  ({
    client,
    isDropdownOpen,
    onToggleDropdown,
    onEdit,
    onDelete,
  }: ClientRowProps) => {
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
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
      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-200 dark:border-gray-700">
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10  bg-blue-500  rounded-lg flex items-center justify-center shadow">
              <span className="text-white font-bold">
                {client.name.charAt(0)}
              </span>
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900 dark:text-white">
                {client.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {client.email}
              </div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
            {client.phone}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="px-3 py-1 inline-flex text-sm font-bold rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
            {client.caseCount} قضية
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
          <button
            className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-500 dark:text-gray-400"
            onClick={onToggleDropdown}
            aria-label="خيارات الإجراءات"
          >
            <FaEllipsisV />
          </button>
          {isDropdownOpen && (
            <div
              ref={dropdownRef}
              className="absolute left-0 mt-2 w-40 bg-white z-20 dark:bg-gray-800 rounded-xl shadow-2xl  border border-gray-200 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700 animate-fade-in"
            >
              <button
                onClick={() => {
                  onEdit(client._id);
                  onToggleDropdown();
                }}
                className="w-full text-right flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <FaEdit className="text-blue-600" />
                <span>تعديل</span>
              </button>
              <button
                onClick={() => {
                  onDelete(client._id, client.name);
                  onToggleDropdown();
                }}
                className="w-full text-right flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-500 dark:hover:bg-red-900/20 transition-colors"
              >
                <FaTrash />
                <span>حذف</span>
              </button>
            </div>
          )}
        </td>
      </tr>
    );
  }
);

ClientRow.displayName = "ClientRow";

// مكون شريط البحث والتحكم في العرض
interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
}

const SearchBar = memo(
  ({
    searchTerm,
    onSearchChange,
    viewMode,
    onViewModeChange,
  }: SearchBarProps) => {
    return (
      <div className="flex flex-col lg:flex-row gap-4 w-full">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="ابحث عن موكل بالاسم، البريد الإلكتروني أو رقم الهاتف..."
            className="p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 pr-12 w-full border border-gray-300 dark:border-gray-700"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <FaSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-lg" />
        </div>

        <div className="flex gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 border border-gray-300 dark:border-gray-700">
            <button
              onClick={() => onViewModeChange("grid")}
              className={`p-3 rounded-xl transition-all duration-200 ${
                viewMode === "grid"
                  ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
              title="عرض شبكي"
            >
              <FaTh />
            </button>
            <button
              onClick={() => onViewModeChange("list")}
              className={`p-3 rounded-xl transition-all duration-200 ${
                viewMode === "list"
                  ? "bg-white dark:bg-gray-700 shadow-sm text-green-600 dark:text-green-400"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
              title="عرض قائمي"
            >
              <FaList />
            </button>
          </div>

          <Link href="/dashboard/clients/add-client">
            <button className=" bg-green-600 hover:from-blue-700 hover:to-green-700 text-white font-bold py-3 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-2 whitespace-nowrap">
              <FaPlus className="text-sm" />
              <span>إضافة موكل</span>
            </button>
          </Link>
        </div>
      </div>
    );
  }
);

SearchBar.displayName = "SearchBar";

// مكون حالة التحميل - محسن بـ memo
const LoadingState = memo(() => (
  <div className="text-center py-16">
    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-green-600 rounded-2xl mb-6 shadow-lg">
      <FaSpinner className="animate-spin text-white text-2xl" />
    </div>
    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
      جاري تحميل البيانات
    </h3>
    <p className="text-gray-500 dark:text-gray-400">يرجى الانتظار قليلاً...</p>
  </div>
));

LoadingState.displayName = "LoadingState";

// مكون حالة الخطأ - محسن بـ memo
interface ErrorStateProps {
  error: string;
}

const ErrorState = memo(({ error }: ErrorStateProps) => (
  <div className="text-center py-8 bg-red-100 dark:bg-red-900/20 rounded-2xl mb-6 border border-red-300 dark:border-red-800">
    <div className="w-16 h-16 bg-red-200 dark:bg-red-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
      <FaTimes className="text-red-600 dark:text-red-400 text-xl" />
    </div>
    <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">
      حدث خطأ
    </h3>
    <p className="text-red-600 dark:text-red-300">{error}</p>
  </div>
));

ErrorState.displayName = "ErrorState";

// مكون حالة عدم وجود نتائج - محسن بـ memo
const EmptyState = memo(() => (
  <div className="text-center py-16 bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-300 dark:border-gray-700">
    <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-green-100 dark:from-blue-900/20 dark:to-green-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
      <FaSearch className="text-blue-600 dark:text-blue-400 text-2xl" />
    </div>
    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
      لا يوجد موكلون
    </h3>
    <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
      لم يتم إضافة أي موكلين بعد. ابدأ بإضافة أول موكل إلى قاعدة البيانات الخاصة
      بك.
    </p>
    <Link href="/dashboard/clients/add-client">
      <button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-bold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 inline-flex items-center gap-2">
        <FaPlus />
        <span>إضافة أول موكل</span>
      </button>
    </Link>
  </div>
));

EmptyState.displayName = "EmptyState";

// المكون الرئيسي لجدول الموكلين - محسن
const ClientsUI = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
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
        setClients((prevClients) =>
          prevClients.filter((client) => client._id !== clientId)
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
  const openDeleteModal = useCallback(
    (clientId: string, clientName: string) => {
      setDeleteModal({ isOpen: true, clientId, clientName });
      setOpenDropdownId(null);
    },
    []
  );

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
    setOpenDropdownId((prevId) => (prevId === clientId ? null : clientId));
  }, []);

  // جلب البيانات عند تحميل المكون
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // تصفية الموكلين بناءً على شريط البحث - محسنة بـ useMemo
  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return clients;

    const searchLower = searchTerm.toLowerCase();
    return clients.filter(
      (client) =>
        client?.name?.toLowerCase().includes(searchLower) ||
        client?.email?.toLowerCase().includes(searchLower) ||
        client?.phone?.includes(searchTerm)
    );
  }, [clients, searchTerm]);

  // إحصائيات سريعة
  const stats = useMemo(() => {
    const totalClients = clients.length;
    const totalCases = clients.reduce(
      (sum, client) => sum + client.caseCount,
      0
    );

    return { totalClients, totalCases };
  }, [clients]);

  // محسن - تجميع حالات الرسم المختلفة
  const renderContent = useMemo(() => {
    if (isLoading) {
      return <LoadingState />;
    }

    if (error) {
      return <ErrorState error={error} />;
    }

    if (filteredClients.length === 0) {
      if (searchTerm) {
        return (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FaSearch className="text-gray-500 text-2xl" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              لا توجد نتائج
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {`لم نتمكن من العثور على أي موكلين يطابقون${searchTerm}`}{" "}
            </p>
          </div>
        );
      }
      return <EmptyState />;
    }

    if (viewMode === "grid") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <ClientCard
              key={client._id}
              client={client}
              onEdit={handleEdit}
              onDelete={openDeleteModal}
            />
          ))}
        </div>
      );
    }

    // List View
    return (
      <div className="overflow-x-auto rounded-2xl shadow-lg border border-gray-300 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th
                scope="col"
                className="px-6 py-4 text-right text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider rounded-tr-2xl"
              >
                الموكل
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-right text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider"
              >
                رقم الهاتف
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-right text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider"
              >
                القضايا
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-right text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider rounded-tl-2xl"
              >
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-300 dark:divide-gray-700">
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
  }, [
    isLoading,
    error,
    filteredClients,
    searchTerm,
    viewMode,
    openDropdownId,
    handleToggleDropdown,
    handleEdit,
    openDeleteModal,
  ]);

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-200 p-4 sm:p-6"
    >
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-300 dark:border-gray-700">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-shadow-xl bg-blue-600 bg-clip-text text-transparent mb-2">
                إدارة الموكلين
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                قم بإدارة قاعدة بيانات موكليك بكل سهولة واحترافية
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 shadow-lg border border-blue-200 dark:border-blue-800 text-center min-w-32">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {stats.totalClients}
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  إجمالي الموكلين
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 shadow-lg border border-green-200 dark:border-green-800 text-center min-w-32">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {stats.totalCases}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  إجمالي القضايا
                </div>
              </div>
            </div>
          </div>

          {/* Search and Controls */}
          <div className="mb-8">
            <SearchBar
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </div>

          {/* Content */}
          {renderContent}
        </div>
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
