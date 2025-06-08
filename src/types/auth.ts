export interface Organization {
  id: string;
  name: string;
  email: string;
  logo?: string;
  createdAt: string;
  adminId: string;
  adminName: string;
  adminEmail: string;
  settings: {
    theme: {
      primaryColor: string;
      secondaryColor: string;
    };
    features: {
      loans: boolean;
      tontine: boolean;
      reports: boolean;
    };
  };
}

export interface User {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'member';
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthState {
  user: User | null;
  organization: Organization | null;
  isLoading: boolean;
  error: string | null;
}