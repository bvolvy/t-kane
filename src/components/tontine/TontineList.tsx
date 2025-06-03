import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Plus, Users, Calendar, DollarSign, Eye, Edit, Trash } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import TontineForm from './TontineForm';
import TontineDetails from './TontineDetails';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/grillUtils';

const TontineList: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);

  const handleViewGroup = (groupId: string) => {
    const group = state.tontineGroups.find(g => g.id === groupId);
    if (group) {
      dispatch({ type: 'SET_CURRENT_TONTINE_GROUP', payload: group });
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    const group = state.tontineGroups.find(g => g.id === groupId);
    if (!group) return;

    if (group.status !== 'completed' && !window.confirm('Are you sure you want to delete this active tontine group?')) {
      return;
    }

    dispatch({ type: 'DELETE_TONTINE_GROUP', payload: groupId });
  };

  const getIntervalLabel = (interval: string, customInterval?: number) => {
    switch (interval) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case '2-weeks': return '2 Weeks';
      case '3-weeks': return '3 Weeks';
      case 'monthly': return 'Monthly';
      case '2-months': return '2 Months';
      case 'trimester': return 'Trimester (3 Months)';
      case 'semester': return 'Semester (6 Months)';
      case 'yearly': return 'Yearly';
      case 'custom': return `Custom (${customInterval} days)`;
      default: return interval;
    }
  };

  const calculateTotalContributions = (groupId: string) => {
    const group = state.tontineGroups.find(g => g.id === groupId);
    if (!group) return 0;

    return group.members.reduce((total, member) => {
      return total + member.contributions.reduce((sum, contribution) => {
        return contribution.status === 'paid' ? sum + contribution.amount : sum;
      }, 0);
    }, 0);
  };

  return (
    <div>
      {state.currentTontineGroup ? (
        <TontineDetails />
      ) : (
        <>
          <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-800">Tontine Groups</h2>
            <Button 
              variant="primary" 
              leftIcon={<Plus size={18} />}
              onClick={() => {
                setEditingGroup(null);
                setShowForm(true);
              }}
            >
              Create New Group
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-purple-500 bg-opacity-50 rounded-lg">
                  <Users size={24} />
                </div>
                <div className="ml-3">
                  <p className="text-purple-100">Total Groups</p>
                  <p className="text-2xl font-bold">{state.tontineGroups.length}</p>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-blue-500 bg-opacity-50 rounded-lg">
                  <Calendar size={24} />
                </div>
                <div className="ml-3">
                  <p className="text-blue-100">Active Groups</p>
                  <p className="text-2xl font-bold">
                    {state.tontineGroups.filter(g => g.status === 'active').length}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-green-500 bg-opacity-50 rounded-lg">
                  <DollarSign size={24} />
                </div>
                <div className="ml-3">
                  <p className="text-green-100">Total Contributions</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(
                      state.tontineGroups.reduce((total, group) => 
                        total + calculateTotalContributions(group.id), 0
                      )
                    )}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {state.tontineGroups.length === 0 ? (
            <Card>
              <div className="text-center py-6">
                <Users size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">No tontine groups found</p>
                <Button
                  variant="primary"
                  onClick={() => {
                    setEditingGroup(null);
                    setShowForm(true);
                  }}
                >
                  Create your first group
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {state.tontineGroups.map(group => (
                <Card key={group.id}>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">{group.name}</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewGroup(group.id)}
                        className="text-purple-600 hover:text-purple-900"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      {group.status === 'pending' && (
                        <button
                          onClick={() => {
                            setEditingGroup(group.id);
                            setShowForm(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit Group"
                        >
                          <Edit size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Group"
                      >
                        <Trash size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Contribution Amount</p>
                      <p className="font-medium text-gray-900">
                        {formatCurrency(group.contributionAmount)}
                        <span className="text-gray-500 text-sm ml-1">
                          per {group.interval.includes('-') ? group.interval.replace('-', ' ') : group.interval}
                        </span>
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Members</p>
                      <p className="font-medium text-gray-900">{group.memberCount} members</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Interval</p>
                      <p className="font-medium text-gray-900">
                        {getIntervalLabel(group.interval, group.customInterval)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Start Date</p>
                      <p className="font-medium text-gray-900">
                        {format(new Date(group.startDate), 'MMM dd, yyyy')}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        group.status === 'active' ? 'bg-green-100 text-green-800' :
                        group.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {group.status.charAt(0).toUpperCase() + group.status.slice(1)}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-500">Total Contributions</p>
                      <p className="text-lg font-semibold text-purple-600">
                        {formatCurrency(calculateTotalContributions(group.id))}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {showForm && (
            <TontineForm
              groupId={editingGroup}
              onClose={() => {
                setShowForm(false);
                setEditingGroup(null);
              }}
            />
          )}
        </>
      )}
    </div>
  );
};

export default TontineList;