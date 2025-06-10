import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { usePermissions } from '../../context/PermissionContext';
import { Plus, Search, Edit, Trash, BarChart2, Upload } from 'lucide-react';
import Button from '../common/Button';
import PermissionGuard from '../common/PermissionGuard';
import ClientForm from './ClientForm';
import ImportClients from './ImportClients';
import { Client } from '../../types';
import Card from '../common/Card';
import { calculateTotalExpected, calculateAmountPaid, calculateBalanceRemaining, formatCurrency } from '../../utils/grillUtils';

const ClientList: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { hasPermission } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const handleAddClient = () => {
    setEditingClient(null);
    setShowForm(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const handleDeleteClient = (id: string) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      dispatch({ type: 'DELETE_CLIENT', payload: id });
    }
  };

  const handleViewClient = (client: Client) => {
    dispatch({ type: 'SET_CURRENT_CLIENT', payload: client });
  };

  const filteredClients = state.clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm)
  );

  return (
    <PermissionGuard module="clients">
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Clients</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
          
          <PermissionGuard module="clients" action="create" showMessage={false}>
            <Button 
              variant="secondary" 
              leftIcon={<Upload size={18} />}
              onClick={() => setShowImport(true)}
            >
              Import
            </Button>
            <Button 
              variant="primary" 
              leftIcon={<Plus size={18} />}
              onClick={handleAddClient}
            >
              Add Client
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grill Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Expected
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount Paid
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    {state.clients.length === 0
                      ? 'No clients found. Add a client to get started.'
                      : 'No clients match your search.'}
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const grill = state.grills.find((g) => g.id === client.grillId);
                  const totalExpected = calculateTotalExpected(client, state.grills);
                  const amountPaid = calculateAmountPaid(client.payments);
                  const balanceRemaining = calculateBalanceRemaining(client, state.grills);
                  const progress = totalExpected > 0 ? (amountPaid / totalExpected) * 100 : 0;
                  
                  return (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{client.name}</div>
                            <div className="text-sm text-gray-500">{client.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {grill ? grill.name : 'Unknown Plan'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(totalExpected)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(amountPaid)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(balanceRemaining)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full ${
                              progress >= 100
                                ? 'bg-green-600'
                                : progress > 50
                                ? 'bg-blue-600'
                                : 'bg-purple-600'
                            }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 mt-1 block">{`${Math.round(progress)}% Complete`}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleViewClient(client)}
                            className="text-purple-600 hover:text-purple-900 cursor-pointer"
                            title="View Details"
                          >
                            <BarChart2 size={18} />
                          </button>
                          
                          <PermissionGuard module="clients" action="edit" showMessage={false}>
                            <button
                              onClick={() => handleEditClient(client)}
                              className="text-blue-600 hover:text-blue-900 cursor-pointer"
                              title="Edit Client"
                            >
                              <Edit size={18} />
                            </button>
                          </PermissionGuard>
                          
                          <PermissionGuard module="clients" action="delete" showMessage={false}>
                            <button
                              onClick={() => handleDeleteClient(client.id)}
                              className="text-red-600 hover:text-red-900 cursor-pointer"
                              title="Delete Client"
                            >
                              <Trash size={18} />
                            </button>
                          </PermissionGuard>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <ClientForm
          client={editingClient || undefined}
          onClose={() => {
            setShowForm(false);
            setEditingClient(null);
          }}
        />
      )}

      {showImport && (
        <ImportClients onClose={() => setShowImport(false)} />
      )}
    </PermissionGuard>
  );
};

export default ClientList;