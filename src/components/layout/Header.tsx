import React, { useState, useRef, useEffect } from 'react';
import { Menu, User, Users, Bell } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { state } = useAppContext();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { adminProfile, notifications } = state;
  const totalClients = state.clients.length;
  const activeClients = state.clients.filter(client => client.isActive).length;
  const unreadNotifications = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-gradient-to-r from-purple-700 to-purple-900 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button 
              onClick={toggleSidebar}
              className="p-2 rounded-full hover:bg-purple-600 transition-colors duration-200 md:hidden"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center">
              <img 
                src="/White_and__Blue_Modern_Digital_Marketing_Logo-removebg-preview.png" 
                alt="T-Kanè Logo" 
                className="h-8 w-auto"
              />
              <h1 className="text-2xl font-bold ml-2">T-Kanè</h1>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-1">
              <Users size={20} />
              <span className="font-medium">Clients ({totalClients})</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="font-medium">Active Plans ({activeClients})</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="relative p-2 hover:bg-purple-600 rounded-full">
              <Bell size={20} />
              {unreadNotifications > 0 && (
                <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-xs flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </button>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-3 hover:bg-purple-600 rounded-lg p-2 transition-colors duration-200"
              >
                <div className="text-sm text-right hidden sm:block">
                  <p className="font-medium">{adminProfile.name}</p>
                  <p className="text-purple-200">{adminProfile.email}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center">
                  <User size={20} />
                </div>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
                  <a
                    href="#profile"
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.hash = '#profile';
                      setShowDropdown(false);
                    }}
                    className="block px-4 py-2 text-gray-800 hover:bg-purple-50"
                  >
                    Profile Settings
                  </a>
                  <a
                    href="#notifications"
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.hash = '#notifications';
                      setShowDropdown(false);
                    }}
                    className="block px-4 py-2 text-gray-800 hover:bg-purple-50"
                  >
                    Notifications
                  </a>
                  <hr className="my-1" />
                  <a
                    href="#logout"
                    onClick={(e) => {
                      e.preventDefault();
                      // Handle logout
                    }}
                    className="block px-4 py-2 text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;