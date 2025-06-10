import React from 'react';
import { Home, Users, BarChart3, Settings, Table, X, CreditCard, ArrowRightLeft } from 'lucide-react';
import { usePermissions } from '../../context/PermissionContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  setActivePage: (page: string) => void;
  activePage: string;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, setActivePage, activePage }) => {
  const { canAccess, isOwner } = usePermissions();

  const allMenuItems = [
    { icon: <Home size={20} />, label: 'Dashboard', value: 'dashboard', module: 'dashboard' },
    { icon: <Users size={20} />, label: 'Clients', value: 'clients', module: 'clients' },
    { icon: <Table size={20} />, label: 'Grill Templates', value: 'grills', module: 'grills' },
    { icon: <ArrowRightLeft size={20} />, label: 'Transactions', value: 'transactions', module: 'transactions' },
    { icon: <CreditCard size={20} />, label: 'Loans', value: 'loans', module: 'loans' },
    { icon: <Users size={20} />, label: 'Tontine', value: 'tontine', module: 'tontine' },
    { icon: <BarChart3 size={20} />, label: 'Reports', value: 'reports', module: 'reports' },
    { icon: <Settings size={20} />, label: 'Settings', value: 'settings', module: 'settings' },
  ];

  // Filter menu items based on permissions
  const menuItems = allMenuItems.filter(item => {
    if (item.value === 'dashboard') return true; // Dashboard is always accessible
    if (item.value === 'settings' && !isOwner()) return false; // Only owners can access settings
    return canAccess(item.module);
  });

  const handleNavigation = (page: string) => {
    setActivePage(page);
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={onClose}
        ></div>
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-30 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:static md:z-0`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-purple-700">T-Kanè</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.value}>
                <button
                  onClick={() => handleNavigation(item.value)}
                  className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                    activePage === item.value
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200 mt-auto">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700">
              <span className="font-bold">A</span>
            </div>
            <div>
              <p className="font-medium text-gray-800">Admin User</p>
              <p className="text-sm text-gray-500">admin@tkane.com</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;