import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { Users, DollarSign, Calendar, ArrowUpRight, CheckCircle as CircleCheck, CheckCircle2 } from 'lucide-react';
import Card from '../common/Card';
import { 
  calculateTotalExpected, 
  calculateAmountPaid, 
  calculateBalanceRemaining,
  isPlanCompleted
} from '../../utils/grillUtils';

const Dashboard: React.FC = () => {
  const { state } = useAppContext();
  
  // Calculate summary data
  const totalClients = state.clients.length;
  const activeClients = state.clients.filter(client => 
    client.isActive && 
    client.grillId && 
    client.payments.some(payment => payment.paid) && 
    !isPlanCompleted(client)
  ).length;
  const completedPlans = state.clients.filter(client => isPlanCompleted(client)).length;
  
  // Calculate financial summary
  let totalExpected = 0;
  let totalPaid = 0;
  let totalRemaining = 0;
  
  state.clients.forEach(client => {
    totalExpected += calculateTotalExpected(client, state.grills);
    totalPaid += calculateAmountPaid(client.payments);
  });
  
  totalRemaining = totalExpected - totalPaid;
  
  // Format currency values
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  // Get clients with upcoming payments (those with active plans)
  const clientsWithActivePlans = state.clients.filter(
    client => 
      client.isActive && 
      client.grillId && 
      client.payments.some(payment => payment.paid) && 
      !isPlanCompleted(client)
  );
  
  // Sort clients by most recent
  const recentClients = [...state.clients]
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-purple-500 bg-opacity-50 rounded-lg">
                <Users size={24} />
              </div>
              <span className="text-purple-200">Total</span>
            </div>
            <p className="text-3xl font-bold mb-1">{totalClients}</p>
            <p className="text-purple-200">Clients</p>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-blue-500 bg-opacity-50 rounded-lg">
                <Calendar size={24} />
              </div>
              <span className="text-blue-200">Active</span>
            </div>
            <p className="text-3xl font-bold mb-1">{activeClients}</p>
            <p className="text-blue-200">Current Plans</p>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-green-500 bg-opacity-50 rounded-lg">
                <CheckCircle2 size={24} />
              </div>
              <span className="text-green-200">Completed</span>
            </div>
            <p className="text-3xl font-bold mb-1">{completedPlans}</p>
            <p className="text-green-200">Plans Completed</p>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-yellow-500 bg-opacity-50 rounded-lg">
                <DollarSign size={24} />
              </div>
              <span className="text-yellow-100">Financial</span>
            </div>
            <p className="text-3xl font-bold mb-1">{formatCurrency(totalPaid)}</p>
            <p className="text-yellow-100">Total Collected</p>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Financial Summary">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Total Expected</p>
                  <p className="text-lg font-semibold">{formatCurrency(totalExpected)}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                  <DollarSign size={20} />
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Total Collected</p>
                  <p className="text-lg font-semibold text-green-600">{formatCurrency(totalPaid)}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  <ArrowUpRight size={20} />
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Balance Remaining</p>
                  <p className="text-lg font-semibold text-blue-600">{formatCurrency(totalRemaining)}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                  <Calendar size={20} />
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Collection Rate</span>
                <span className="font-medium">{totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div
                  className="bg-purple-600 h-2.5 rounded-full"
                  style={{ width: `${totalExpected > 0 ? (totalPaid / totalExpected) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </Card>
          
          <Card title="Active Plans">
            {clientsWithActivePlans.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No active plans found.</p>
            ) : (
              <div className="space-y-3">
                {clientsWithActivePlans.map(client => {
                  const grill = state.grills.find(g => g.id === client.grillId);
                  if (!grill) return null;
                  
                  const totalExpected = calculateTotalExpected(client, state.grills);
                  const amountPaid = calculateAmountPaid(client.payments);
                  const progress = totalExpected > 0 ? (amountPaid / totalExpected) * 100 : 0;
                  
                  return (
                    <div key={client.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mr-3">
                        <span className="font-bold">{client.name.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{client.name}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="truncate">{grill.name} Plan</span>
                          <span className="mx-1">•</span>
                          <span>{`${Math.round(progress)}%`}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div
                            className="bg-purple-600 h-1.5 rounded-full"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="ml-3 text-right">
                        <p className="text-sm font-medium">{formatCurrency(amountPaid)}</p>
                        <p className="text-xs text-gray-500">of {formatCurrency(totalExpected)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
      
      <Card title="Recently Added Clients">
        {recentClients.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No clients found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentClients.map(client => {
                  const grill = state.grills.find(g => g.id === client.grillId);
                  if (!grill) return null;
                  
                  const totalExpected = calculateTotalExpected(client, state.grills);
                  const amountPaid = calculateAmountPaid(client.payments);
                  const progress = totalExpected > 0 ? (amountPaid / totalExpected) * 100 : 0;
                  const isComplete = isPlanCompleted(client);
                  const isActive = client.isActive && client.grillId && client.payments.some(payment => payment.paid) && !isComplete;
                  
                  return (
                    <tr key={client.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{client.name}</div>
                        <div className="text-sm text-gray-500">{client.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{grill.name}</div>
                        <div className="text-sm text-gray-500">${grill.baseAmount}/day</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(client.startDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          isComplete ? 'bg-green-100 text-green-800' : 
                          isActive ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {isComplete ? 'Completed' : isActive ? 'Active' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end">
                          <span className="mr-2 text-xs text-gray-500">{Math.round(progress)}%</span>
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                isComplete ? 'bg-green-600' : 'bg-purple-600'
                              }`}
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;