import { ReactNode } from 'react';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  grillId?: string;
  startDate: string;
  payments: Payment[];
  withdrawals: Withdrawal[];
  loans: Loan[];
  transfers: Transfer[];
  deposits: Deposit[];
  isActive: boolean;
}

export interface Deposit {
  id: string;
  amount: number;
  date: string;
  note?: string;
  reversed?: boolean;
  reversalDate?: string;
  reversalNote?: string;
}

export interface Grill {
  id: string;
  name: string;
  baseAmount: number;
  duration: number;
  description?: string;
  adminPercentage: number;
}

export interface Payment {
  day: number;
  amount: number;
  paid: boolean;
  paidDate?: string;
}

export interface Withdrawal {
  id: string;
  amount: number;
  date: string;
  note?: string;
  reversed?: boolean;
  reversalDate?: string;
  reversalNote?: string;
}

export interface Transfer {
  id: string;
  amount: number;
  date: string;
  fromClientId: string;
  toClientId: string;
  note?: string;
  reversed?: boolean;
  reversalDate?: string;
  reversalNote?: string;
}

export interface Loan {
  id: string;
  amount: number;
  interestRate: number;
  startDate: string;
  dueDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  payments: LoanPayment[];
  note?: string;
}

export interface LoanPayment {
  id: string;
  amount: number;
  date: string;
  type: 'principal' | 'interest';
}

export interface AdminProfile {
  name: string;
  email: string;
  role: string;
  avatar?: string;
  lastLogin?: string;
  twoFactorEnabled?: boolean;
  notificationPreferences?: {
    email: boolean;
    push: boolean;
    desktop: boolean;
  };
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  date: string;
  read: boolean;
  link?: string;
  category?: 'system' | 'security' | 'transaction' | 'user';
  priority?: 'low' | 'medium' | 'high';
}

export interface TontineGroup {
  id: string;
  name: string;
  contributionAmount: number;
  memberCount: number;
  interval: 'daily' | 'weekly' | '2-weeks' | '3-weeks' | 'monthly' | '2-months' | 'trimester' | 'semester' | 'yearly' | 'custom';
  customInterval?: number;
  startDate: string;
  members: TontineMember[];
  status: 'pending' | 'active' | 'completed';
  description?: string;
}

export interface TontineMember {
  id: string;
  clientId: string;
  payoutOrder: number;
  payoutDate?: string;
  hasPaidOut: boolean;
  contributions: TontineContribution[];
}

export interface TontineContribution {
  id: string;
  amount: number;
  date: string;
  periodNumber: number;
  status: 'pending' | 'paid';
}

export interface AppState {
  clients: Client[];
  grills: Grill[];
  currentClient: Client | null;
  currentGrill: Grill | null;
  currentLoan: Loan | null;
  adminProfile: AdminProfile;
  notifications: Notification[];
  tontineGroups: TontineGroup[];
  currentTontineGroup: TontineGroup | null;
}