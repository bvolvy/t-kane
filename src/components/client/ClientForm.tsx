import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Client } from '../../types';
import { generateId, generatePayments } from '../../utils/grillUtils';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import { X } from 'lucide-react';

interface ClientFormProps {
  client?: Client;
  onClose: () => void;
}

const ClientForm: React.FC<ClientFormProps> = ({ client, onClose }) => {
  const { state, dispatch } = useAppContext();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    grillId: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        email: client.email,
        phone: client.phone,
        grillId: client.grillId || '',
      });
    }
  }, [client]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const today = new Date().toISOString();
    const selectedGrill = formData.grillId ? state.grills.find((g) => g.id === formData.grillId) : null;

    if (client) {
      // Update existing client
      const updatedClient: Client = {
        ...client,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        grillId: formData.grillId || undefined,
        // Only regenerate payments if grill changed and new grill is selected
        payments: (client.grillId !== formData.grillId && selectedGrill) 
          ? generatePayments(selectedGrill) 
          : client.payments,
      };
      dispatch({ type: 'UPDATE_CLIENT', payload: updatedClient });
    } else {
      // Create new client
      const newClient: Client = {
        id: generateId(),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        grillId: formData.grillId || undefined,
        startDate: today,
        payments: selectedGrill ? generatePayments(selectedGrill) : [],
        withdrawals: [],
        loans: [],
        transfers: [],
        deposits: [],
        isActive: true,
      };
      dispatch({ type: 'ADD_CLIENT', payload: newClient });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {client ? 'Edit Client' : 'Add New Client'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <Input
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter client's full name"
            fullWidth
            error={errors.name}
          />

          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter client's email"
            fullWidth
            error={errors.email}
          />

          <Input
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Enter client's phone number"
            fullWidth
            error={errors.phone}
          />

          <Select
            label="Grill Plan (Optional)"
            name="grillId"
            value={formData.grillId}
            onChange={handleChange}
            options={state.grills.map((grill) => ({
              value: grill.id,
              label: `${grill.name} - ${grill.baseAmount}/day`,
            }))}
            fullWidth
          />

          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {client ? 'Update Client' : 'Add Client'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientForm;