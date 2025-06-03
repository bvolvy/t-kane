import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { ArrowLeft, Plus, Users, Calendar, DollarSign, CheckCircle, Ban } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import Select from '../common/Select';
import { format, addDays, addWeeks, addMonths, addYears } from 'date-fns';
import { formatCurrency, generateId } from '../../utils/grillUtils';

const TontineDetails: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedOrder, setSelectedOrder] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!state.currentTontineGroup) return null;

  const group = state.currentTontineGroup;

  const handleBack = () => {
    dispatch({ type: 'SET_CURRENT_TONTINE_GROUP', payload: null });
  };

  const handleAddMember = () => {
    if (!selectedClient || !selectedOrder) {
      setErrors({
        ...errors,
        member: 'Please select both client and payout order'
      });
      return;
    }

    const orderNum = parseInt(selectedOrder);
    if (group.members.some(m => m.payoutOrder === orderNum)) {
      setErrors({
        ...errors,
        member: 'This payout order is already assigned'
      });
      return;
    }

    if (group.members.some(m => m.clientId === selectedClient)) {
      setErrors({
        ...errors,
        member: 'This client is already a member'
      });
      return;
    }

    // Generate contribution schedule based on interval
    const contributions = [];
    let currentDate = new Date(group.startDate);
    
    for (let i = 0; i < group.memberCount; i++) {
      contributions.push({
        id: generateId(),
        amount: group.contributionAmount,
        date: currentDate.toISOString(),
        periodNumber: i + 1,
        status: 'pending'
      });

      // Calculate next contribution date
      switch (group.interval) {
        case 'daily':
          currentDate = addDays(currentDate, 1);
          break;
        case 'weekly':
          currentDate = addWeeks(currentDate, 1);
          break;
        case 'monthly':
          currentDate = addMonths(currentDate, 1);
          break;
        case 'yearly':
          currentDate = addYears(currentDate, 1);
          break;
      }
    }

    const updatedGroup = {
      ...group,
      members: [
        ...group.members,
        {
          id: generateId(),
          clientId: selectedClient,
          payoutOrder: orderNum,
          payoutDate: contributions[orderNum - 1].date,
          hasPaidOut: false,
          contributions
        }
      ]
    };

    // If all members are added, set status to active
    if (updatedGroup.members.length === group.memberCount) {
      updatedGroup.status = 'active';
    }

    dispatch({ type: 'UPDATE_TONTINE_GROUP', payload: updatedGroup });
    setSelectedClient('');
    setSelectedOrder('');
    setErrors({});
  };

  const handleMarkContribution = (memberId: string, contributionId: string, status: 'paid' | 'pending') => {
    dispatch({
      type: 'UPDATE_TONTINE_CONTRIBUTION',
      payload: {
        groupId: group.id,
        memberId,
        contributionId,
        status
      }
    });

    // Check if this completes a payout period
    const member = group.members.find(m => m.id === memberId);
    if (member && !member.hasPaidOut) {
      const allMemberContributions = group.members.every(m => 
        m.contributions.some(c => 
          c.periodNumber === member.payoutOrder && c.status === 'paid'
        )
      );

      if (allMemberContributions) {
        // Mark member as paid out
        const updatedGroup = {
          ...group,
          members: group.members.map(m => 
            m.id === memberId
              ? { ...m, hasPaidOut: true }
              : m
          )
        };

        // Check if all members have been paid out
        const allPaidOut = updatedGroup.members.every(m => m.hasPaidOut);
        if (allPaidOut) {
          updatedGroup.status = 'completed';
        }

        dispatch({ type: 'UPDATE_TONTINE_GROUP', payload: updatedGroup });
      }
    }
  };

  const getClientName = (clientId: string) => {
    return state.clients.find(c => c.id === clientId)?.name || 'Unknown Client';
  };

  const calculateMemberProgress = (memberId: string) => {
    const member = group.members.find(m => m.id === memberId);
    if (!member) return 0;

    const paidContributions = member.contributions.filter(c => c.status === 'paid').length;
    const totalContributions = member.contributions.length;
    return totalContributions > 0 ? (paidContributions / totalContributions) * 100 : 0;
  };

  const availableClients = state.clients.filter(
    client => !group.members.some(member => member.clientId === client.id)
  );

  const availableOrders = Array.from(
    { length: group.memberCount },
    (_, i) => i + 1
  ).filter(
    order => !group.members.some(member => member.payoutOrder === order)
  );

  return (
    <>
      <div className="mb-6 flex justify-between items-center">
        <Button 
          variant="secondary" 
          leftIcon={<ArrowLeft size={18} />} 
          onClick={handleBack}
        >
          Back to Groups
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="md:col-span-2">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{group.name}</h2>
              <p className="text-gray-500">{group.description}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              group.status === 'active' ? 'bg-green-100 text-green-800' :
              group.status === 'completed' ? 'bg-blue-100 text-blue-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {group.status.charAt(0).toUpperCase() + group.status.slice(1)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Contribution Amount</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(group.contributionAmount)}
                <span className="text-sm text-gray-500 ml-1">
                  per {group.interval.slice(0, -2)}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Members</p>
              <p className="text-xl font-bold text-gray-900">
                {group.members.length} / {group.memberCount}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Start Date</p>
              <p className="text-gray-900">
                {format(new Date(group.startDate), 'MMM dd, yyyy')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Interval</p>
              <p className="text-gray-900">
                {group.interval.charAt(0).toUpperCase() + group.interval.slice(1)}
              </p>
            </div>
          </div>
        </Card>

        {group.status === 'pending' && (
          <Card>
            <h3 className="font-semibold text-lg mb-4">Add Member</h3>
            <div className="space-y-4">
              <Select
                label="Select Client"
                value={selectedClient}
                onChange={(e) => {
                  setSelectedClient(e.target.value);
                  setErrors({});
                }}
                options={availableClients.map(client => ({
                  value: client.id,
                  label: client.name
                }))}
                fullWidth
              />

              <Select
                label="Payout Order"
                value={selectedOrder}
                onChange={(e) => {
                  setSelectedOrder(e.target.value);
                  setErrors({});
                }}
                options={availableOrders.map(order => ({
                  value: order.toString(),
                  label: `Position ${order}`
                }))}
                fullWidth
              />

              {errors.member && (
                <p className="text-sm text-red-600">{errors.member}</p>
              )}

              <Button
                variant="primary"
                leftIcon={<Plus size={18} />}
                onClick={handleAddMember}
                isFullWidth
              >
                Add Member
              </Button>
            </div>
          </Card>
        )}
      </div>

      <Card title="Members & Contributions">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payout Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payout Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {group.members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No members added yet
                  </td>
                </tr>
              ) : (
                group.members
                  .sort((a, b) => a.payoutOrder - b.payoutOrder)
                  .map(member => {
                    const progress = calculateMemberProgress(member.id);
                    return (
                      <tr key={member.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {getClientName(member.clientId)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            Position {member.payoutOrder}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {member.payoutDate ? 
                              format(new Date(member.payoutDate), 'MMM dd, yyyy') :
                              'Not set'
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            member.hasPaidOut
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {member.hasPaidOut ? 'Paid Out' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full mr-2">
                              <div
                                className="h-2 bg-purple-600 rounded-full"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-500">
                              {Math.round(progress)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {group.status === 'active' && (
        <Card title="Contribution Schedule" className="mt-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  {group.members.map(member => (
                    <th key={member.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {getClientName(member.clientId)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.from({ length: group.memberCount }).map((_, periodIndex) => {
                  const periodNumber = periodIndex + 1;
                  const firstMemberContribution = group.members[0]?.contributions[periodIndex];
                  
                  return (
                    <tr key={periodNumber}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Period {periodNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(firstMemberContribution.date), 'MMM dd, yyyy')}
                      </td>
                      {group.members.map(member => {
                        const contribution = member.contributions[periodIndex];
                        return (
                          <td key={member.id} className="px-6 py-4 whitespace-nowrap">
                            {contribution.status === 'paid' ? (
                              <button
                                onClick={() => handleMarkContribution(member.id, contribution.id, 'pending')}
                                className="text-green-600 hover:text-green-900"
                                title="Mark as Unpaid"
                              >
                                <CheckCircle size={20} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleMarkContribution(member.id, contribution.id, 'paid')}
                                className="text-gray-400 hover:text-gray-600"
                                title="Mark as Paid"
                              >
                                <Ban size={20} />
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
};

export default TontineDetails;