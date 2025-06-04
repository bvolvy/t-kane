import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { Bell, Info, CheckCircle, AlertTriangle, XCircle, X, Trash2 } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';

const NotificationCenter: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { notifications } = state;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationClass = (type: string) => {
    switch (type) {
      case 'info':
        return 'bg-blue-50 border-blue-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const handleMarkAsRead = (id: string) => {
    dispatch({
      type: 'MARK_NOTIFICATION_READ',
      payload: id
    });
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      dispatch({ type: 'CLEAR_ALL_NOTIFICATIONS' });
    }
  };

  const formatNotificationDate = (date: string) => {
    const notificationDate = new Date(date);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return notificationDate.toLocaleDateString();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
          <p className="text-gray-500 mt-1">
            {notifications.filter(n => !n.read).length} unread notifications
          </p>
        </div>
        {notifications.length > 0 && (
          <Button
            variant="secondary"
            leftIcon={<Trash2 size={18} />}
            onClick={handleClearAll}
          >
            Clear All
          </Button>
        )}
      </div>

      <Card>
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No notifications</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start p-4 border rounded-lg ${getNotificationClass(
                  notification.type
                )} ${!notification.read ? 'border-l-4' : ''}`}
              >
                <div className="flex-shrink-0 mr-3">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {notification.message}
                      </p>
                      <div className="mt-2 flex items-center space-x-4">
                        <span className="text-xs text-gray-500">
                          {formatNotificationDate(notification.date)}
                        </span>
                        {notification.link && (
                          <a
                            href={notification.link}
                            className="text-xs text-purple-600 hover:text-purple-800"
                          >
                            View Details
                          </a>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="ml-4 text-gray-400 hover:text-gray-600 flex-shrink-0"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default NotificationCenter;