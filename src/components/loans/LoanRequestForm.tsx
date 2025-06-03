import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import { X } from 'lucide-react';
import { generateId } from '../../utils/grillUtils';
import { addDays } from 'date-fns';

interface LoanRequestFormProps {
  onClose: () => void;
}

const LoanRequestForm: React.FC<LoanRequestFormProps> = ({ onClose }) => {
  const { state, dispatch } = useAppContext();
  const [formData, setFormData] = useState({
    clientId: '',
    amount: '',
    interestRate: '5',
    duration: '30',
    note: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const amount = parseFloat(formData.amount);
    const interestRate = parseFloat(formData.interestRate);
    const duration = parseInt(formData.duration);

    if (!formData.clientId) newErrors.clientId = 'Please select a client';
    if (!amount || isNaN(amount) || amount <= 0) newErrors.amount = 'Please enter a valid amount';
    if (!interestRate || isNaN(interestRate) || interestRate < 0) newErrors.interestRate = 'Please enter a valid interest rate';
    if (!duration || isNaN(duration) || duration <= 0) newErrors.duration = 'Please enter a valid duration';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const startDate = new Date().toISOString();
    const dueDate = addDays(new Date(), parseInt(formData.duration)).toISOString();

    const newLoan = {
      id: generateId(),
      amount: parseFloat(formData.amount),
      interestRate: parseFloat(formData.interestRate),
      startDate,
      dueDate,
      status: 'pending' as const,
      payments: [],
      note: formData.note.trim() || undefined,
    };

    dispatch({
      type: 'ADD_LOAN',
      payload: {
        clientId: formData.clientId,
        loan: newLoan,
      },
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Request Loan</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <Select
            label="Client"
            name="clientId"
            value={formData.clientId}
            onChange={handleChange}
            options={state.clients.map(client => ({
              value: client.id,
              label: client.name
            }))}
            fullWidth
            error={errors.clientId}
          />

          <Input
            label="Loan Amount ($)"
            name="amount"
            type="number"
            value={formData.amount}
            onChange={handleChange}
            placeholder="Enter loan amount"
            min="0.01"
            step="0.01"
            fullWidth
            error={errors.amount}
          />

          <Input
            label="Interest Rate (%)"
            name="interestRate"
            type="number"
            value={formData.interestRate}
            onChange={handleChange}
            placeholder="Enter interest rate"
            min="0"
            step="0.1"
            fullWidth
            error={errors.interestRate}
          />

          <Input
            label="Duration (Days)"
            name="duration"
            type="number"
            value={formData.duration}
            onChange={handleChange}
            placeholder="Enter loan duration in days"
            min="1"
            fullWidth
            error={errors.duration}
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note (Optional)
            </label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              placeholder="Add a note for this loan request"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Submit Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoanRequestForm;