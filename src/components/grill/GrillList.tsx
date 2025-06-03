import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Plus, Edit, Trash } from 'lucide-react';
import Button from '../common/Button';
import GrillForm from './GrillForm';
import { Grill } from '../../types';
import Card from '../common/Card';
import { calculateGrillTotal, calculateAdminEarnings, formatCurrency } from '../../utils/grillUtils';

const GrillList: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [editingGrill, setEditingGrill] = useState<Grill | null>(null);

  const handleAddGrill = () => {
    setEditingGrill(null);
    setShowForm(true);
  };

  const handleEditGrill = (grill: Grill) => {
    setEditingGrill(grill);
    setShowForm(true);
  };

  const handleDeleteGrill = (id: string) => {
    // Check if any clients are using this grill
    const clientsUsingGrill = state.clients.filter(
      (client) => client.grillId === id
    );

    if (clientsUsingGrill.length > 0) {
      alert(
        `Cannot delete this grill template as it is being used by ${clientsUsingGrill.length} client(s).`
      );
      return;
    }

    if (window.confirm('Are you sure you want to delete this grill template?')) {
      dispatch({ type: 'DELETE_GRILL', payload: id });
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Grill Templates</h2>
        <Button 
          variant="primary" 
          leftIcon={<Plus size={18} />}
          onClick={handleAddGrill}
        >
          Create Template
        </Button>
      </div>

      {state.grills.length === 0 ? (
        <Card>
          <div className="text-center py-6">
            <p className="text-gray-500 mb-4">No grill templates found.</p>
            <Button variant="primary" onClick={handleAddGrill}>
              Create your first template
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {state.grills.map((grill) => {
            // Count clients using this grill
            const clientCount = state.clients.filter(
              (client) => client.grillId === grill.id
            ).length;

            const totalAmount = calculateGrillTotal(grill);
            const adminEarnings = calculateAdminEarnings(grill);

            return (
              <Card key={grill.id} className="flex flex-col h-full">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">{grill.name}</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditGrill(grill)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Template"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteGrill(grill.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Template"
                        disabled={clientCount > 0}
                      >
                        <Trash size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-gray-500 text-sm">Base Amount</p>
                    <p className="text-xl font-bold text-purple-600">
                      ${grill.baseAmount}
                      <span className="text-sm text-gray-500 font-normal ml-1">per day</span>
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-gray-500 text-sm">Duration</p>
                    <p className="font-medium">{grill.duration} days</p>
                  </div>

                  <div className="mb-4">
                    <p className="text-gray-500 text-sm">Admin Percentage</p>
                    <p className="font-medium text-blue-600">{grill.adminPercentage}%</p>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-gray-500 text-sm">Total Plan Value</p>
                    <p className="font-medium">{formatCurrency(totalAmount)}</p>
                  </div>

                  <div className="mb-4">
                    <p className="text-gray-500 text-sm">Admin Earnings</p>
                    <p className="font-medium text-green-600">{formatCurrency(adminEarnings)}</p>
                  </div>
                  
                  {grill.description && (
                    <div className="mb-4">
                      <p className="text-gray-500 text-sm">Description</p>
                      <p className="text-gray-700">{grill.description}</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    {clientCount === 0
                      ? 'Not used by any clients'
                      : `Used by ${clientCount} client${clientCount !== 1 ? 's' : ''}`}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {showForm && (
        <GrillForm
          grill={editingGrill || undefined}
          onClose={() => {
            setShowForm(false);
            setEditingGrill(null);
          }}
        />
      )}
    </>
  );
};

export default GrillList;