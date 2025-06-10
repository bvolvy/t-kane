import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import Dashboard from '../components/dashboard/Dashboard';
import ClientList from '../components/client/ClientList';
import ClientDetails from '../components/client/ClientDetails';
import GrillList from '../components/grill/GrillList';
import LoanList from '../components/loans/LoanList';
import TontineList from '../components/tontine/TontineList';
import Reports from '../components/reports/Reports';
import SettingsTabs from '../components/settings/SettingsTabs';
import AdminProfile from '../components/admin/AdminProfile';
import NotificationCenter from '../components/admin/NotificationCenter';
import TransactionList from '../components/transactions/TransactionList';
import PermissionGuard from '../components/common/PermissionGuard';
import { useAppContext } from '../context/AppContext';
import { usePermissions } from '../context/PermissionContext';

const AdminPanel: React.FC = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [activeSettingsTab, setActiveSettingsTab] = useState('backup');
  const { state, dispatch } = useAppContext();
  const { canAccess, isOwner } = usePermissions();

  const handlePageChange = (page: string) => {
    // Check if user has permission to access the page
    if (page !== 'dashboard' && page !== 'profile' && page !== 'notifications') {
      if (page === 'settings' && !isOwner()) {
        return; // Only owners can access settings
      }
      if (!canAccess(page)) {
        return; // User doesn't have permission
      }
    }

    if (page !== 'clients' && state.currentClient) {
      dispatch({ type: 'SET_CURRENT_CLIENT', payload: null });
    }
    
    if (page !== 'loans' && state.currentLoan) {
      dispatch({ 
        type: 'SET_CURRENT_LOAN', 
        payload: { loan: null, clientId: null } 
      });
    }
    
    setActivePage(page);
  };

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'clients':
        return state.currentClient ? <ClientDetails /> : <ClientList />;
      case 'loans':
        return (
          <PermissionGuard module="loans">
            <LoanList />
          </PermissionGuard>
        );
      case 'tontine':
        return (
          <PermissionGuard module="tontine">
            <TontineList />
          </PermissionGuard>
        );
      case 'grills':
        return <GrillList />;
      case 'transactions':
        return (
          <PermissionGuard module="transactions">
            <TransactionList />
          </PermissionGuard>
        );
      case 'reports':
        return (
          <PermissionGuard module="reports">
            <Reports />
          </PermissionGuard>
        );
      case 'settings':
        return isOwner() ? (
          <SettingsTabs
            activeTab={activeSettingsTab}
            setActiveTab={setActiveSettingsTab}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Access Restricted</h3>
            <p className="text-gray-500">Only organization owners can access settings.</p>
          </div>
        );
      case 'profile':
        return <AdminProfile />;
      case 'notifications':
        return <NotificationCenter />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activePage={activePage} setActivePage={handlePageChange}>
      {renderContent()}
    </Layout>
  );
};

export default AdminPanel;