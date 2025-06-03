import React from 'react';
import { Save, Shield } from 'lucide-react';
import BackupRestore from './BackupRestore';
import SecuritySettings from './SecuritySettings';

interface SettingsTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const SettingsTabs: React.FC<SettingsTabsProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'backup', label: 'Backup & Restore', icon: Save },
    { id: 'security', label: 'Security & Privacy', icon: Shield },
  ];

  return (
    <div>
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Settings">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                <Icon className="w-5 h-5 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'backup' && <BackupRestore />}
        {activeTab === 'security' && <SecuritySettings />}
      </div>
    </div>
  );
};

export default SettingsTabs