// src/types/user.ts
import mongoose from 'mongoose';

// Define the User interface
export interface IUser extends mongoose.Document {
  name: string;
  email: string;
  password: string;
  accountType: 'owner' | 'employee';
  ownerId?: mongoose.Schema.Types.ObjectId;
  firmInfo: {
    firmName?: string;
    licenseNumber?: string;
    address?: string;
    phone?: string;
    establishedDate?: Date;
    subscriptionPlan: 'basic' | 'professional' | 'enterprise';
    maxEmployees: number;
  };
  role: 'owner' | 'partner' | 'senior_lawyer' | 'lawyer' | 'junior_lawyer' | 'legal_assistant' | 'secretary' | 'accountant' | 'intern';
  department: string;
  permissions: {
    cases: {
      view: boolean;
      create: boolean;
      edit: boolean;
      delete: boolean;
      assign: boolean;
      viewAll: boolean;
    };
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
    documents: {
      view: boolean;
      upload: boolean;
      download: boolean;
      delete: boolean;
      editSensitive: boolean;
    };
    financial: {
      viewReports: boolean;
      createInvoices: boolean;
      viewPayments: boolean;
      editPrices: boolean;
    };
    employees: {
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
  };
  employeeInfo: {
    employeeId?: string;
    phone?: string;
    address?: string;
    hireDate: Date;
    salary?: number;
    licenseNumber?: string;
    specialization: string[];
    contractType: 'full_time' | 'part_time' | 'contract' | 'intern';
  };
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  createdBy?: mongoose.Schema.Types.ObjectId;

  // Instance methods
  matchPassword(enteredPassword: string): Promise<boolean>;
  hasPermission(category: string, action: string): boolean;
  canAccessDepartment(department: string): boolean;
  getEmployees(): Promise<IUser[]>;
  belongsToFirm(firmOwnerId: mongoose.Schema.Types.ObjectId): boolean;
}

// Define the firm stats interface
export interface IFirmStats {
  totalEmployees: number;
  activeEmployees: number;
  byRole: string[];
  byDepartment: string[];
}

// Define the User model interface with static methods
export interface IUserModel extends mongoose.Model<IUser> {
  getFirmStats(ownerId: string): Promise<IFirmStats>;
}

// Export the User model type
export type UserModel = IUserModel;