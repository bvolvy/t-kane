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
import { useAppContext } from '../context/AppContext';

const AdminPanel: React.FC = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [activeSettingsTab, setActiveSettingsTab] = useState('backup');
  const { state, dispatch } = useAppContext();

  const handlePageChange = (page: string) => {
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
        return <LoanList />;
      case 'tontine':
        return <TontineList />;
      case 'grills':
        return <GrillList />;
      case 'transactions':
        return <TransactionList />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return (
          <SettingsTabs
            activeTab={activeSettingsTab}
            setActiveTab={setActiveSettingsTab}
          />
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