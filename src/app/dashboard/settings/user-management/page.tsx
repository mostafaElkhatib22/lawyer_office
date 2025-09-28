/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Trash2,
  Eye,
  EyeOff,
  UserPlus,
  Shield,
  Users,
  Building2,
  Filter,
  TrendingUp,
  Edit3,
} from "lucide-react";
import { useSession } from "next-auth/react";

// Interfaces for data structures
interface Employee {
  _id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  isActive: boolean;
  employeeInfo: {
    employeeId: string;
    phone: string;
    specialization: string[];
    contractType: string;
    hireDate: string;
  };
  permissions?: Permissions;
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
  maxAllowed: number;
  remainingSlots: number;
  subscriptionPlan: string;
}

interface NewEmployee {
  name: string;
  email: string;
  password?: string;
  role: string;
  department: string;
  employeeId: string;
  phone: string;
  specialization: string[];
  contractType: string;
}

interface PermissionCategory {
  title: string;
  permissions: { [key: string]: string };
}

interface Permissions {
  cases: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    assign: boolean;
    viewAll: boolean;
  };
  sessions: { view: boolean };
  clients: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    viewContactInfo: boolean;
  };
  appointments: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    viewAll: boolean;
  };
  financial: {
    viewReports: boolean;
    createInvoices: boolean;
    viewPayments: boolean;
    editPrices: boolean;
  };
  employees?: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    managePermissions: boolean;
  };
  reports: {
    viewBasic: boolean;
    viewDetailed: boolean;
    export: boolean;
    viewFinancial: boolean;
  };
  firmSettings: {
    viewSettings: boolean;
    editSettings: boolean;
    manageSubscription: boolean;
    manageBackup: boolean;
  };
}

interface PermissionModalProps {
  employee: Employee;
  onClose: () => void;
  onSave: (updatedPermissions: Permissions) => void;
}

const UserManagementPage = () => {
  const { data: session } = useSession();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    inactive: 0,
    maxAllowed: 5,
    remainingSlots: 5,
    subscriptionPlan: "basic",
  });
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showPermissionModal, setShowPermissionModal] =
    useState<boolean>(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const [newEmployee, setNewEmployee] = useState<NewEmployee>({
    name: "",
    email: "",
    password: "",
    role: "lawyer",
    department: "general",
    employeeId: "",
    phone: "",
    specialization: [],
    contractType: "full_time",
  });

  // خيارات الأدوار والأقسام
  const roles: { [key: string]: string } = {
    partner: "شريك",
    senior_lawyer: "محامي نقض",
    lawyer: " محامي اسئناف",
    junior_lawyer: "محامي ابتدائي",
    legal_assistant: "جدول عام ",
    secretary: "سكرتير",
    accountant: "محاسب",
    intern: "متدرب",
  };

  const departments: { [key: string]: string } = {
    civil_law: "القانون المدني",
    criminal_law: "القانون الجنائي",
    commercial_law: "القانون التجاري",
    family_law: "الأحوال الشخصية",
    labor_law: "قانون العمل",
    real_estate: "العقارات",
    corporate_law: "قانون الشركات",
    tax_law: "القانون الضريبي",
    administrative: "الإدارة",
    accounting: "المحاسبة",
    general: "عام",
  };

  const contractTypes: { [key: string]: string } = {
    full_time: "دوام كامل",
    part_time: "دوام جزئي",
    contract: "مؤقت",
    intern: "متدرب",
  };

  // جلب قائمة الموظفين
  useEffect(() => {
    if (session?.user?.accountType === "owner") {
      fetchEmployees();
    }
  }, [session]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/employees/add");
      if (response.ok) {
        const result = await response.json();
        setEmployees(result.data.employees);
        setStats(result.data.stats);
      } else {
        console.error("Failed to fetch employees");
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  // تصفية الموظفين
  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.employeeInfo?.employeeId || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || employee.role === filterRole;
    const matchesDepartment =
      filterDepartment === "all" || employee.department === filterDepartment;

    return matchesSearch && matchesRole && matchesDepartment;
  });

  // إضافة موظف جديد
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/employees/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newEmployee),
      });

      const result = await response.json();

      if (response.ok) {
        setEmployees([...employees, result.data]);
        setStats((prev) => ({
          ...prev,
          total: prev.total + 1,
          active: prev.active + 1,
          remainingSlots: prev.remainingSlots - 1,
        }));
        setShowAddModal(false);
        setNewEmployee({
          name: "",
          email: "",
          password: "",
          role: "lawyer",
          department: "general",
          employeeId: "",
          phone: "",
          specialization: [],
          contractType: "full_time",
        });
        console.log("تم إضافة الموظف بنجاح!");
      } else {
        console.error(`خطأ: ${result.message}`);
      }
    } catch (error) {
      console.error("Error adding employee:", error);
      console.error("حدث خطأ أثناء إضافة الموظف");
    }
  };

  // تبديل حالة الموظف
  const toggleEmployeeStatus = async (employeeId: string) => {
    try {
      const employee = employees.find((emp) => emp._id === employeeId);
      if (!employee) return;

      const response = await fetch(`/api/employees/${employeeId}/permissions`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !employee.isActive,
        }),
      });

      if (response.ok) {
        setEmployees(
          employees.map((emp) =>
            emp._id === employeeId ? { ...emp, isActive: !emp.isActive } : emp
          )
        );

        setStats((prev) => ({
          ...prev,
          active: employee.isActive ? prev.active - 1 : prev.active + 1,
          inactive: employee.isActive ? prev.inactive + 1 : prev.inactive - 1,
        }));

        console.log(
          `تم ${employee.isActive ? "إلغاء تفعيل" : "تفعيل"} الموظف بنجاح`
        );
      } else {
        const result = await response.json();
        console.error(`خطأ في تحديث حالة الموظف: ${result.message}`);
      }
    } catch (error) {
      console.error("Error toggling employee status:", error);
      console.error("حدث خطأ أثناء تحديث حالة الموظف");
    }
  };

  // تعديل موظف
  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    try {
      const response = await fetch(`/api/employees/${editingEmployee._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editingEmployee.name,
          email: editingEmployee.email,
          role: editingEmployee.role,
          department: editingEmployee.department,
          employeeInfo: editingEmployee.employeeInfo,
        }),
      });

      const result = await response.json();
      console.log(result.data, "result from update");
      if (response.ok) {
        setEmployees(
          employees.map((emp) =>
            emp._id === editingEmployee._id ? result.data : emp
          )
        );
        setShowEditModal(false);
        setEditingEmployee(null);
        console.log("تم تحديث بيانات الموظف بنجاح!");
      } else {
        console.error(`خطأ: ${result.message}`);
      }
    } catch (error) {
      console.error("Error updating employee:", error);
      console.error("حدث خطأ أثناء تحديث بيانات الموظف");
    }
    console.log("Editing employee:", editingEmployee);
  };
  const handleDeleteEmployee = async (employeeId: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا الموظف؟")) {
      try {
        const response = await fetch(`/api/employees/${employeeId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const deletedEmployee = employees.find(
            (emp) => emp._id === employeeId
          );
          setEmployees(employees.filter((emp) => emp._id !== employeeId));
          setStats((prev) => ({
            ...prev,
            total: prev.total - 1,
            active: deletedEmployee?.isActive ? prev.active - 1 : prev.active,
            inactive: !deletedEmployee?.isActive
              ? prev.inactive - 1
              : prev.inactive,
            remainingSlots: prev.remainingSlots + 1,
          }));
          console.log("تم حذف الموظف بنجاح");
        } else {
          const result = await response.json();
          console.error(`خطأ في حذف الموظف: ${result.message}`);
        }
      } catch (error) {
        console.error("Error deleting employee:", error);
        console.error("حدث خطأ أثناء حذف الموظف");
      }
    }
  };

  // التحقق من الصلاحيات
  if (!session?.user || session.user.accountType !== "owner") {
    return (
      <div
        className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center"
        dir="rtl"
      >
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md mx-4">
          <div className="w-20 h-20 bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900 dark:to-red-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building2 size={40} className="text-red-600 dark:text-red-300" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            غير مصرح
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            هذه الصفحة متاحة لأصحاب المكاتب فقط.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center"
        dir="rtl"
      >
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin"></div>
            <div className="w-16 h-16 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin absolute top-0"></div>
          </div>
          <p className="mt-6 text-gray-600 dark:text-gray-300 font-medium">
            جاري تحميل البيانات...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 lg:p-6"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    إدارة الموظفين
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 text-lg">
                    {session?.user.firmInfo?.firmName || "مكتب المحاماة"} -
                    إدارة حسابات الموظفين وصلاحياتهم
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl p-4 text-center border border-blue-100 dark:border-blue-800/50">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.active}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  من {stats.maxAllowed} موظف نشط
                </div>
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                disabled={stats.remainingSlots === 0}
                className={`group relative px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                  stats.remainingSlots === 0
                    ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl"
                }`}
              >
                <div className="flex items-center gap-2">
                  <UserPlus size={20} />
                  <span>إضافة موظف جديد</span>
                </div>
                {stats.remainingSlots === 0 && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                    !
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-700/50 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-blue-700 dark:text-blue-400 text-sm font-semibold">
                    إجمالي الموظفين
                  </p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-300">
                    {stats.total}
                  </p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-7 w-7 text-white" />
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-6 border border-green-200/50 dark:border-green-700/50 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-green-700 dark:text-green-400 text-sm font-semibold">
                    الموظفين النشطين
                  </p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-300">
                    {stats.active}
                  </p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-2xl p-6 border border-orange-200/50 dark:border-orange-700/50 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-orange-700 dark:text-orange-400 text-sm font-semibold">
                    غير النشطين
                  </p>
                  <p className="text-3xl font-bold text-orange-900 dark:text-orange-300">
                    {stats.inactive}
                  </p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <EyeOff className="h-7 w-7 text-white" />
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-6 border border-purple-200/50 dark:border-purple-700/50 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-purple-700 dark:text-purple-400 text-sm font-semibold">
                    المتاح
                  </p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-300">
                    {stats.remainingSlots}
                  </p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Plus className="h-7 w-7 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6">
          <div className="flex flex-col lg:flex-row items-center gap-4">
            {/* البحث */}
            <div className="relative flex-1 min-w-0">
              <Search
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
                size={20}
              />
              <input
                type="text"
                placeholder="البحث بالاسم أو البريد أو رقم الموظف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300"
              />
            </div>

            {/* زر إظهار/إخفاء الفلاتر */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all duration-300 text-gray-700 dark:text-gray-300"
            >
              <Filter size={20} />
              <span>فلترة</span>
            </button>

            {/* عدد النتائج */}
            <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-700/50">
              <span className="text-blue-700 dark:text-blue-300 font-medium">
                النتائج: {filteredEmployees.length} من {employees.length}
              </span>
            </div>
          </div>

          {/* فلاتر قابلة للطي */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white transition-all duration-300"
              >
                <option value="all">جميع الأدوار</option>
                {Object.entries(roles).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>

              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white transition-all duration-300"
              >
                <option value="all">جميع الأقسام</option>
                {Object.entries(departments).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Employees Table */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
                <tr>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    معلومات الموظف
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    الدور والقسم
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    نوع التعاقد
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    تاريخ التوظيف
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredEmployees.map((employee, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-all duration-200"
                  >
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-lg">
                              {employee.name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="mr-4 space-y-1">
                          <div className="text-sm font-bold text-gray-900 dark:text-white">
                            {employee.name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            {employee.email}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md inline-block">
                            ID:{" "}
                            {employee.employeeInfo?.employeeId || "غير محدد"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                          {roles[employee.role]}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {departments[employee.department]}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="inline-flex px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-700 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-600">
                        {contractTypes[employee.employeeInfo?.contractType] ||
                          "غير محدد"}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border-2 ${
                          employee.isActive
                            ? "bg-gradient-to-r from-green-100 to-green-200 dark:from-green-800 dark:to-green-700 text-green-800 dark:text-green-200 border-green-300 dark:border-green-600"
                            : "bg-gradient-to-r from-red-100 to-red-200 dark:from-red-800 dark:to-red-700 text-red-800 dark:text-red-200 border-red-300 dark:border-red-600"
                        }`}
                      >
                        {employee.isActive ? "نشط" : "غير نشط"}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-300 font-medium">
                        {employee.employeeInfo?.hireDate
                          ? new Date(
                              employee.employeeInfo.hireDate
                            ).toLocaleDateString("ar-EG")
                          : "غير محدد"}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingEmployee(employee);
                            setShowEditModal(true);
                          }}
                          className="group p-2 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-800/50 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 rounded-lg transition-all duration-300 hover:scale-110"
                          title="تعديل بيانات الموظف"
                        >
                          <Edit3
                            size={16}
                            className="group-hover:rotate-12 transition-transform duration-300"
                          />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedEmployee(employee);
                            setShowPermissionModal(true);
                          }}
                          className="group p-2 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800/50 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 rounded-lg transition-all duration-300 hover:scale-110"
                          title="إدارة الصلاحيات"
                        >
                          <Shield
                            size={16}
                            className="group-hover:rotate-12 transition-transform duration-300"
                          />
                        </button>
                        <button
                          onClick={() => toggleEmployeeStatus(employee._id)}
                          className={`group p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                            employee.isActive
                              ? "bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-800/50 text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300"
                              : "bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-800/50 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                          }`}
                          title={employee.isActive ? "إلغاء تفعيل" : "تفعيل"}
                        >
                          {employee.isActive ? (
                            <EyeOff
                              size={16}
                              className="group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <Eye
                              size={16}
                              className="group-hover:scale-110 transition-transform duration-300"
                            />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(employee._id)}
                          className="group p-2 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-800/50 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 rounded-lg transition-all duration-300 hover:scale-110"
                          title="حذف"
                        >
                          <Trash2
                            size={16}
                            className="group-hover:rotate-12 transition-transform duration-300"
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <Users className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                          {employees.length === 0
                            ? "لم يتم إضافة أي موظفين بعد"
                            : "لا توجد نتائج مطابقة للبحث"}
                        </p>
                        {employees.length === 0 && (
                          <button
                            onClick={() => setShowAddModal(true)}
                            className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-300"
                          >
                            إضافة أول موظف
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Employee Modal */}
        {showEditModal && editingEmployee && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white dark:bg-gray-800 border border-white/20 dark:border-gray-700/50 shadow-2xl rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Edit3 size={20} />
                  </div>
                  تعديل بيانات الموظف
                </h3>
                <p className="text-green-100 mt-1">
                  تعديل بيانات الموظف: {editingEmployee.name}
                </p>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <form onSubmit={handleEditEmployee} className="space-y-6">
                  {/* معلومات أساسية */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-6">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      المعلومات الأساسية
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">
                          الاسم الكامل *
                        </label>
                        <input
                          type="text"
                          required
                          value={editingEmployee.name}
                          onChange={(e) =>
                            setEditingEmployee({
                              ...editingEmployee,
                              name: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent text-gray-900 dark:text-white transition-all duration-300"
                          placeholder="أدخل الاسم الكامل"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">
                          البريد الإلكتروني *
                        </label>
                        <input
                          type="email"
                          required
                          value={editingEmployee.email}
                          onChange={(e) =>
                            setEditingEmployee({
                              ...editingEmployee,
                              email: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent text-gray-900 dark:text-white transition-all duration-300"
                          placeholder="example@law-firm.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">
                          رقم الموظف *
                        </label>
                        <input
                          type="text"
                          required
                          value={editingEmployee.employeeInfo.employeeId}
                          onChange={(e) =>
                            setEditingEmployee({
                              ...editingEmployee,
                              employeeInfo: {
                                ...editingEmployee.employeeInfo,
                                employeeId: e.target.value,
                              },
                            })
                          }
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent text-gray-900 dark:text-white transition-all duration-300"
                          placeholder="مثال: EMP001"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">
                          رقم الهاتف
                        </label>
                        <input
                          type="tel"
                          value={editingEmployee.employeeInfo.phone || ""}
                          onChange={(e) =>
                            setEditingEmployee({
                              ...editingEmployee,
                              employeeInfo: {
                                ...editingEmployee.employeeInfo,
                                phone: e.target.value,
                              },
                            })
                          }
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent text-gray-900 dark:text-white transition-all duration-300"
                          placeholder="+20 10 1234 5678"
                        />
                      </div>
                    </div>
                  </div>

                  {/* معلومات العمل */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-6">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                      معلومات العمل
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">
                          المنصب الوظيفي *
                        </label>
                        <select
                          value={editingEmployee.role}
                          onChange={(e) =>
                            setEditingEmployee({
                              ...editingEmployee,
                              role: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent text-gray-900 dark:text-white transition-all duration-300"
                        >
                          {Object.entries(roles).map(([key, value]) => (
                            <option key={key} value={key}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">
                          القسم *
                        </label>
                        <select
                          value={editingEmployee.department}
                          onChange={(e) =>
                            setEditingEmployee({
                              ...editingEmployee,
                              department: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent text-gray-900 dark:text-white transition-all duration-300"
                        >
                          {Object.entries(departments).map(([key, value]) => (
                            <option key={key} value={key}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">
                          نوع التعاقد
                        </label>
                        <select
                          value={editingEmployee.employeeInfo.contractType}
                          onChange={(e) =>
                            setEditingEmployee({
                              ...editingEmployee,
                              employeeInfo: {
                                ...editingEmployee.employeeInfo,
                                contractType: e.target.value,
                              },
                            })
                          }
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent text-gray-900 dark:text-white transition-all duration-300"
                        >
                          {Object.entries(contractTypes).map(([key, value]) => (
                            <option key={key} value={key}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* أزرار التحكم */}
                  <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingEmployee(null);
                      }}
                      className="px-6 py-3 text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all duration-300 transform hover:scale-105"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      حفظ التغييرات
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Add Employee Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white dark:bg-gray-800 border border-white/20 dark:border-gray-700/50 shadow-2xl rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <UserPlus size={20} />
                  </div>
                  إضافة موظف جديد
                </h3>
                <p className="text-blue-100 mt-1">
                  أدخل بيانات الموظف الجديد لإضافته إلى النظام
                </p>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <form onSubmit={handleAddEmployee} className="space-y-6">
                  {/* معلومات أساسية */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-6">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      المعلومات الأساسية
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">
                          الاسم الكامل *
                        </label>
                        <input
                          type="text"
                          required
                          value={newEmployee.name}
                          onChange={(e) =>
                            setNewEmployee({
                              ...newEmployee,
                              name: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white transition-all duration-300"
                          placeholder="أدخل الاسم الكامل"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">
                          البريد الإلكتروني *
                        </label>
                        <input
                          type="email"
                          required
                          value={newEmployee.email}
                          onChange={(e) =>
                            setNewEmployee({
                              ...newEmployee,
                              email: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white transition-all duration-300"
                          placeholder="example@law-firm.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">
                          كلمة المرور *
                        </label>
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={newEmployee.password}
                          onChange={(e) =>
                            setNewEmployee({
                              ...newEmployee,
                              password: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white transition-all duration-300"
                          placeholder="كلمة مرور قوية (6 أحرف على الأقل)"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">
                          رقم الموظف *
                        </label>
                        <input
                          type="text"
                          required
                          value={newEmployee.employeeId}
                          onChange={(e) =>
                            setNewEmployee({
                              ...newEmployee,
                              employeeId: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white transition-all duration-300"
                          placeholder="مثال: EMP001"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">
                          رقم الهاتف
                        </label>
                        <input
                          type="tel"
                          value={newEmployee.phone}
                          onChange={(e) =>
                            setNewEmployee({
                              ...newEmployee,
                              phone: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white transition-all duration-300"
                          placeholder="+20 10 1234 5678"
                        />
                      </div>
                    </div>
                  </div>

                  {/* معلومات العمل */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-6">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                      معلومات العمل
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">
                          المنصب الوظيفي *
                        </label>
                        <select
                          value={newEmployee.role}
                          onChange={(e) =>
                            setNewEmployee({
                              ...newEmployee,
                              role: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white transition-all duration-300"
                        >
                          {Object.entries(roles).map(([key, value]) => (
                            <option key={key} value={key}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">
                          القسم *
                        </label>
                        <select
                          value={newEmployee.department}
                          onChange={(e) =>
                            setNewEmployee({
                              ...newEmployee,
                              department: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white transition-all duration-300"
                        >
                          {Object.entries(departments).map(([key, value]) => (
                            <option key={key} value={key}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">
                          نوع التعاقد
                        </label>
                        <select
                          value={newEmployee.contractType}
                          onChange={(e) =>
                            setNewEmployee({
                              ...newEmployee,
                              contractType: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white transition-all duration-300"
                        >
                          {Object.entries(contractTypes).map(([key, value]) => (
                            <option key={key} value={key}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* أزرار التحكم */}
                  <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-6 py-3 text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all duration-300 transform hover:scale-105"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      إضافة الموظف
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Permissions Modal */}
        {showPermissionModal && selectedEmployee && (
          <PermissionModal
            employee={selectedEmployee}
            onClose={() => setShowPermissionModal(false)}
            onSave={(updatedPermissions) => {
              setEmployees(
                employees.map((emp) =>
                  emp._id === selectedEmployee._id
                    ? { ...emp, permissions: updatedPermissions }
                    : emp
                )
              );
              setShowPermissionModal(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

// مكون إدارة الصلاحيات
const PermissionModal: React.FC<PermissionModalProps> = ({
  employee,
  onClose,
  onSave,
}) => {
  const [permissions, setPermissions] = useState<Permissions>(
    employee.permissions || {
      cases: {
        view: true,
        create: false,
        edit: false,
        delete: false,
        assign: false,
        viewAll: false,
      },
      sessions: { view: true },
      clients: {
        view: true,
        create: false,
        edit: false,
        delete: false,
        viewContactInfo: true,
      },
      appointments: {
        view: true,
        create: false,
        edit: false,
        delete: false,
        viewAll: false,
      },
      financial: {
        viewReports: false,
        createInvoices: false,
        viewPayments: false,
        editPrices: false,
      },
      employees: {
        view: false,
        create: false,
        edit: false,
        delete: false,
        managePermissions: false,
      },
      reports: {
        viewBasic: true,
        viewDetailed: false,
        export: false,
        viewFinancial: false,
      },
      firmSettings: {
        viewSettings: false,
        editSettings: false,
        manageSubscription: false,
        manageBackup: false,
      },
    }
  );

  const permissionLabels: { [key: string]: PermissionCategory } = {
    cases: {
      title: "إدارة القضايا",
      permissions: {
        view: "عرض القضايا",
        create: "إنشاء قضايا جديدة",
        edit: "تعديل القضايا",
        delete: "حذف القضايا",
        assign: "تكليف القضايا",
        viewAll: "عرض جميع القضايا",
      },
    },
    clients: {
      title: "إدارة العملاء",
      permissions: {
        view: "عرض العملاء",
        create: "إضافة عملاء جدد",
        edit: "تعديل بيانات العملاء",
        delete: "حذف العملاء",
        viewContactInfo: "عرض بيانات الاتصال",
      },
    },
    sessions: {
      title: "إدارة الجلسات",
      permissions: {
        view: "عرض الجلسات",
      },
    },
    appointments: {
      title: "إدارة المواعيد",
      permissions: {
        view: "عرض المواعيد",
        create: "إنشاء مواعيد جديدة",
        edit: "تعديل المواعيد",
        delete: "حذف المواعيد",
        viewAll: "عرض جميع المواعيد",
      },
    },
    financial: {
      title: "الإدارة المالية",
      permissions: {
        viewReports: "عرض التقارير المالية",
        createInvoices: "إنشاء فواتير",
        viewPayments: "عرض المدفوعات",
        editPrices: "تعديل الأسعار",
      },
    },
    reports: {
      title: "التقارير",
      permissions: {
        viewBasic: "عرض التقارير الأساسية",
        viewDetailed: "عرض التقارير المفصلة",
        export: "تصدير التقارير",
        viewFinancial: "عرض التقارير المالية",
      },
    },
  };

  const handlePermissionChange = (category: string, permission: string) => {
    setPermissions((prev) => ({
      ...prev,
      [category]: {
        ...(prev[category as keyof Permissions] || {}),
        [permission]: !(prev[category as keyof Permissions] as any)?.[
          permission
        ],
      },
    }));
  };

  const handleSave = async () => {
    try {
      const response = await fetch(
        `/api/employees/${employee._id}/permissions`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ permissions }),
        }
      );

      if (response.ok) {
        onSave(permissions);
        console.log("تم تحديث الصلاحيات بنجاح");
      } else {
        const result = await response.json();
        console.error(`خطأ: ${result.message}`);
      }
    } catch (error) {
      console.error("Error updating permissions:", error);
      console.error("حدث خطأ أثناء تحديث الصلاحيات");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white dark:bg-gray-800 border border-white/20 dark:border-gray-700/50 shadow-2xl rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Shield size={20} />
                </div>
                إدارة الصلاحيات
              </h3>
              <p className="text-purple-100 mt-1">
                تحديد صلاحيات الموظف: {employee.name}
              </p>
            </div>
            <div className="text-right text-purple-100">
              <div className="text-sm">المنصب: {employee.role}</div>
              <div className="text-sm">القسم: {employee.department}</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(permissionLabels).map(
              ([category, categoryData]) => (
                <div
                  key={category}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-600"
                >
                  <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
                    {categoryData.title}
                  </h4>
                  <div className="space-y-3">
                    {Object.entries(categoryData.permissions).map(
                      ([permission, label]) => (
                        <label
                          key={permission}
                          className="flex items-center group cursor-pointer"
                        >
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={
                                (permissions as any)[category]?.[permission] ||
                                false
                              }
                              onChange={() =>
                                handlePermissionChange(category, permission)
                              }
                              className="sr-only"
                            />
                            <div
                              className={`w-5 h-5 rounded-md border-2 transition-all duration-300 ${
                                (permissions as any)[category]?.[permission]
                                  ? "bg-gradient-to-r from-purple-500 to-blue-500 border-purple-500"
                                  : "border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700"
                              }`}
                            >
                              {(permissions as any)[category]?.[permission] && (
                                <svg
                                  className="w-3 h-3 text-white mt-0.5 ml-0.5"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </div>
                          </div>
                          <span className="mr-3 text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200">
                            {label}
                          </span>
                        </label>
                      )
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-4 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <button
            onClick={onClose}
            className="px-6 py-3 text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-xl transition-all duration-300 transform hover:scale-105"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            حفظ الصلاحيات
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;
