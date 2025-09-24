/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Search,  Trash2, Eye, EyeOff, UserPlus,  Shield, Users, Building2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

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
  cases: { view: boolean; create: boolean; edit: boolean; delete: boolean; assign: boolean; viewAll: boolean };
  clients: { view: boolean; create: boolean; edit: boolean; delete: boolean; viewContactInfo: boolean };
  appointments: { view: boolean; create: boolean; edit: boolean; delete: boolean; viewAll: boolean };
  documents: { view: boolean; upload: boolean; download: boolean; delete: boolean; editSensitive: boolean };
  financial: { viewReports: boolean; createInvoices: boolean; viewPayments: boolean; editPrices: boolean };
  employees?: { view: boolean; create: boolean; edit: boolean; delete: boolean; managePermissions: boolean };
  reports: { viewBasic: boolean; viewDetailed: boolean; export: boolean; viewFinancial: boolean };
  firmSettings: { viewSettings: boolean; editSettings: boolean; manageSubscription: boolean; manageBackup: boolean };
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
    subscriptionPlan: 'basic'
  });
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showPermissionModal, setShowPermissionModal] = useState<boolean>(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);

  const [newEmployee, setNewEmployee] = useState<NewEmployee>({
    name: '',
    email: '',
    password: '',
    role: 'lawyer',
    department: 'general',
    employeeId: '',
    phone: '',
    specialization: [],
    contractType: 'full_time'
  });

  // خيارات الأدوار والأقسام
  const roles: { [key: string]: string } = {
    partner: 'شريك',
    senior_lawyer: 'محامي أول',
    lawyer: 'محامي',
    junior_lawyer: 'محامي مساعد',
    legal_assistant: 'مساعد قانوني',
    secretary: 'سكرتير',
    accountant: 'محاسب',
    intern: 'متدرب'
  };

  const departments: { [key: string]: string } = {
    civil_law: 'القانون المدني',
    criminal_law: 'القانون الجنائي',
    commercial_law: 'القانون التجاري',
    family_law: 'الأحوال الشخصية',
    labor_law: 'قانون العمل',
    real_estate: 'العقارات',
    corporate_law: 'قانون الشركات',
    tax_law: 'القانون الضريبي',
    administrative: 'الإدارة',
    accounting: 'المحاسبة',
    general: 'عام'
  };

  const contractTypes: { [key: string]: string } = {
    full_time: 'دوام كامل',
    part_time: 'دوام جزئي',
    contract: 'مؤقت',
    intern: 'متدرب'
  };

  // جلب قائمة الموظفين
  useEffect(() => {
    if (session?.user?.accountType === 'owner') {
      fetchEmployees();
    }
  }, [session]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/employees/add');
      if (response.ok) {
        const result = await response.json();
        setEmployees(result.data.employees);
        setStats(result.data.stats);
      } else {
        console.error('Failed to fetch employees');
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  // تصفية الموظفين
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.employeeInfo?.employeeId || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || employee.role === filterRole;
    const matchesDepartment = filterDepartment === 'all' || employee.department === filterDepartment;
    
    return matchesSearch && matchesRole && matchesDepartment;
  });

  // إضافة موظف جديد
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/employees/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEmployee),
      });

      const result = await response.json();

      if (response.ok) {
        setEmployees([...employees, result.data]);
        setStats(prev => ({
          ...prev,
          total: prev.total + 1,
          active: prev.active + 1,
          remainingSlots: prev.remainingSlots - 1
        }));
        setShowAddModal(false);
        setNewEmployee({
          name: '',
          email: '',
          password: '',
          role: 'lawyer',
          department: 'general',
          employeeId: '',
          phone: '',
          specialization: [],
          contractType: 'full_time'
        });
        // استخدام رسالة بدلاً من alert()
        console.log('تم إضافة الموظف بنجاح!'); 
      } else {
        console.error(`خطأ: ${result.message}`);
      }
    } catch (error) {
      console.error('Error adding employee:', error);
      console.error('حدث خطأ أثناء إضافة الموظف'); 
    }
  };

  // تبديل حالة الموظف
  const toggleEmployeeStatus = async (employeeId: string) => {
    try {
      const response = await fetch(`/api/employees/${employeeId}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        setEmployees(employees.map(emp => 
          emp._id === employeeId ? { ...emp, isActive: !emp.isActive } : emp
        ));
        
        const employee = employees.find(emp => emp._id === employeeId);
        if (employee) {
          setStats(prev => ({
            ...prev,
            active: employee.isActive ? prev.active - 1 : prev.active + 1
          }));
        }
      }
    } catch (error) {
      console.error('Error toggling employee status:', error);
    }
  };

  // حذف موظف
  const handleDeleteEmployee = async (employeeId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
      try {
        const response = await fetch(`/api/employees/${employeeId}/permissions`, {
          method: 'DELETE'
        });

        if (response.ok) {
          setEmployees(employees.filter(emp => emp._id !== employeeId));
          setStats(prev => ({
            ...prev,
            total: prev.total - 1,
            remainingSlots: prev.remainingSlots + 1
          }));
        }
      } catch (error) {
        console.error('Error deleting employee:', error);
      }
    }
  };

  // التحقق من الصلاحيات
  if (!session?.user || session.user.accountType !== 'owner') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center dark:bg-gray-800 dark:text-white" dir="rtl">
        <div className="text-center">
          <Building2 size={64} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2 dark:text-white">غير مصرح</h2>
          <p className="text-gray-600">هذه الصفحة متاحة لأصحاب المكاتب فقط.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center dark:bg-gray-800 dark:text-white" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-white">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-800 dark:text-white" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 dark:bg-gray-800 dark:text-white">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2 dark:text-white">إدارة الموظفين</h1>
              <p className="text-gray-600 dark:text-white">
                {session.user.firmInfo?.firmName || 'مكتب المحاماة'} - إدارة حسابات الموظفين وصلاحياتهم
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500 text-center ">
                <div className="font-medium">{stats.active} / {stats.maxAllowed}</div>
                <div>موظف نشط</div>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                disabled={stats.remainingSlots === 0}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  stats.remainingSlots === 0 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:text-white ' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                }`}
              >
                <UserPlus size={20} />
                إضافة موظف جديد
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 rounded-lg p-4 dark:bg-gray-600 dark:text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium dark:text-blue-500">إجمالي الموظفين</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-500">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4 dark:bg-gray-600 dark:text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium dark:text-green-400">الموظفين النشطين</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-400">{stats.active}</p>
                </div>
                <Eye className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-4 dark:bg-gray-600 dark:text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium dark:text-orange-500">غير النشطين</p>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-500">{stats.inactive}</p>
                </div>
                <EyeOff className="h-8 w-8 text-orange-600 dark:text-orange-500" />
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4 dark:bg-gray-600 dark:text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium dark:text-purple-500">المتاح</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-500">{stats.remainingSlots}</p>
                </div>
                <Plus className="h-8 w-8 text-purple-600 dark:text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 dark:bg-gray-600 dark:text-white">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* البحث */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="البحث بالاسم أو البريد أو رقم الموظف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* تصفية حسب الدور */}
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع الأدوار</option>
              {Object.entries(roles).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>

            {/* تصفية حسب القسم */}
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع الأقسام</option>
              {Object.entries(departments).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>

            {/* عدد النتائج */}
            <div className="flex items-center justify-center text-gray-600 dark:text-white">
              <span>النتائج: {filteredEmployees.length} من {employees.length}</span>
            </div>
          </div>
        </div>

        {/* Employees Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden dark:bg-gray-800 dark:text-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-white">
                    معلومات الموظف
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-white">
                    الدور والقسم
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-white">
                    نوع التعاقد
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-white">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-white">
                    تاريخ التوظيف
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-white">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-500">
                {filteredEmployees.map((employee,index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center dark:bg-blue-600">
                            <span className="text-blue-600 font-medium text-sm dark:text-white">
                              {employee.name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="mr-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{employee.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-200">{employee.email}</div>
                          <div className="text-xs text-gray-400">
                            ID: {employee.employeeInfo?.employeeId || 'غير محدد'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-300">{roles[employee.role]}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-300">{departments[employee.department]}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-600 dark:text-white">
                        {contractTypes[employee.employeeInfo?.contractType] || 'غير محدد'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        employee.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                          : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                      }`}>
                        {employee.isActive ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-300">
                        {employee.employeeInfo?.hireDate 
                          ? new Date(employee.employeeInfo.hireDate).toLocaleDateString('ar-EG')
                          : 'غير محدد'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedEmployee(employee);
                            setShowPermissionModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded dark:text-blue-400 dark:hover:text-blue-200"
                          title="إدارة الصلاحيات"
                        >
                          <Shield size={16} />
                        </button>
                        <button
                          onClick={() => toggleEmployeeStatus(employee._id)}
                          className={`p-1 rounded ${employee.isActive ? 'text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300' : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'}`}
                          title={employee.isActive ? 'إلغاء تفعيل' : 'تفعيل'}
                        >
                          {employee.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(employee._id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded dark:text-red-400 dark:hover:text-red-200"
                          title="حذف"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-300">
                      {employees.length === 0 ? 'لم يتم إضافة أي موظفين بعد' : 'لا توجد نتائج مطابقة للبحث'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Employee Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 dark:bg-gray-900  ">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800 dark:text-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4 dark:text-gray-300">إضافة موظف جديد</h3>
                <form onSubmit={handleAddEmployee} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">الاسم *</label>
                      <input
                        type="text"
                        required
                        value={newEmployee.name}
                        onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500  dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">البريد الإلكتروني *</label>
                      <input
                        type="email"
                        required
                        value={newEmployee.email}
                        onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">كلمة المرور *</label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={newEmployee.password}
                        onChange={(e) => setNewEmployee({...newEmployee, password: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">رقم الموظف *</label>
                      <input
                        type="text"
                        required
                        value={newEmployee.employeeId}
                        onChange={(e) => setNewEmployee({...newEmployee, employeeId: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">رقم الهاتف</label>
                      <input
                        type="tel"
                        value={newEmployee.phone}
                        onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">الدور *</label>
                      <select
                        value={newEmployee.role}
                        onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        {Object.entries(roles).map(([key, value]) => (
                          <option key={key} value={key}>{value}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">القسم *</label>
                      <select
                        value={newEmployee.department}
                        onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        {Object.entries(departments).map(([key, value]) => (
                          <option key={key} value={key}>{value}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">نوع التعاقد</label>
                      <select
                        value={newEmployee.contractType}
                        onChange={(e) => setNewEmployee({...newEmployee, contractType: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white  "
                      >
                        {Object.entries(contractTypes).map(([key, value]) => (
                          <option key={key} value={key}>{value}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600  "
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
              setEmployees(employees.map(emp => 
                emp._id === selectedEmployee._id 
                  ? { ...emp, permissions: updatedPermissions }
                  : emp
              ));
              setShowPermissionModal(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

// مكون إدارة الصلاحيات
const PermissionModal: React.FC<PermissionModalProps> = ({ employee, onClose, onSave }) => {
  const [permissions, setPermissions] = useState<Permissions>(employee.permissions || {
    cases: { view: true, create: false, edit: false, delete: false, assign: false, viewAll: false },
    clients: { view: true, create: false, edit: false, delete: false, viewContactInfo: true },
    appointments: { view: true, create: false, edit: false, delete: false, viewAll: false },
    documents: { view: true, upload: false, download: true, delete: false, editSensitive: false },
    financial: { viewReports: false, createInvoices: false, viewPayments: false, editPrices: false },
    employees: { view: false, create: false, edit: false, delete: false, managePermissions: false },
    reports: { viewBasic: true, viewDetailed: false, export: false, viewFinancial: false },
    firmSettings: { viewSettings: false, editSettings: false, manageSubscription: false, manageBackup: false },
  });

  const permissionLabels: { [key: string]: PermissionCategory } = {
    cases: {
      title: 'إدارة القضايا',
      permissions: {
        view: 'عرض القضايا',
        create: 'إنشاء قضايا جديدة',
        edit: 'تعديل القضايا',
        delete: 'حذف القضايا',
        assign: 'تكليف القضايا',
        viewAll: 'عرض جميع القضايا'
      }
    },
    clients: {
      title: 'إدارة العملاء',
      permissions: {
        view: 'عرض العملاء',
        create: 'إضافة عملاء جدد',
        edit: 'تعديل بيانات العملاء',
        delete: 'حذف العملاء',
        viewContactInfo: 'عرض بيانات الاتصال'
      }
    },
    appointments: {
      title: 'إدارة المواعيد',
      permissions: {
        view: 'عرض المواعيد',
        create: 'إنشاء مواعيد جديدة',
        edit: 'تعديل المواعيد',
        delete: 'حذف المواعيد',
        viewAll: 'عرض جميع المواعيد'
      }
    },
    documents: {
      title: 'إدارة المستندات',
      permissions: {
        view: 'عرض المستندات',
        upload: 'رفع مستندات جديدة',
        download: 'تحميل المستندات',
        delete: 'حذف المستندات',
        editSensitive: 'تعديل المستندات الحساسة'
      }
    },
    financial: {
      title: 'الإدارة المالية',
      permissions: {
        viewReports: 'عرض التقارير المالية',
        createInvoices: 'إنشاء فواتير',
        viewPayments: 'عرض المدفوعات',
        editPrices: 'تعديل الأسعار'
      }
    },
    reports: {
      title: 'التقارير',
      permissions: {
        viewBasic: 'عرض التقارير الأساسية',
        viewDetailed: 'عرض التقارير المفصلة',
        export: 'تصدير التقارير',
        viewFinancial: 'عرض التقارير المالية'
      }
    }
  };

  const handlePermissionChange = (category: string, permission: string) => {
   setPermissions(prev => ({
  ...prev,
  [category]: {
    ...prev[category as keyof Permissions] || {}, // fallback لو undefined
    [permission]: !(
      (prev[category as keyof Permissions] as any)?.[permission]
    ),
  },
}));
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/employees/${employee._id}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permissions }),
      });

      if (response.ok) {
        onSave(permissions);
        console.log('تم تحديث الصلاحيات بنجاح');
      } else {
        const result = await response.json();
        console.error(`خطأ: ${result.message}`);
      }
    } catch (error) {
      console.error('Error updating permissions:', error);
      console.error('حدث خطأ أثناء تحديث الصلاحيات');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 dark:bg-gray-800 dark:bg-opacity-50">
      <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-6xl shadow-lg rounded-md bg-white dark:bg-gray-800 dark:text-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-300">
              إدارة صلاحيات: {employee.name}
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              الدور: {employee.role} | القسم: {employee.department}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-96 overflow-y-auto">
            {Object.entries(permissionLabels).map(([category, categoryData]) => (
              <div key={category} className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3 dark:text-gray-300">{categoryData.title}</h4>
                <div className="space-y-2">
                  {Object.entries(categoryData.permissions).map(([permission, label]) => (
                    <label key={permission} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={(permissions as any)[category]?.[permission] || false}
                        onChange={() => handlePermissionChange(category, permission)}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:text-blue-300 dark:foucs:ring-blue-300 dark:border-gray-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-200">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              إلغاء
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              حفظ الصلاحيات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;
