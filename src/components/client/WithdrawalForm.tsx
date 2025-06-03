import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import Button from '../common/Button';
import Input from '../common/Input';
import { X } from 'lucide-react';
import { generateId } from '../../utils/grillUtils';

interface WithdrawalFormProps {
  clientId: string;
  availableBalance: number;
  onClose: () => void;
}

const WithdrawalForm: React.FC<WithdrawalFormProps> = ({ clientId, availableBalance, onClose }) => {
  const { dispatch } = useAppContext();
  const [formData, setFormData] = useState({
    amount: '',
    note: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const amount = parseFloat(formData.amount);

    if (!amount || isNaN(amount)) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    } else if (amount > availableBalance) {
      newErrors.amount = 'Amount exceeds available balance';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    dispatch({
      type: 'ADD_WITHDRAWAL',
      payload: {
        clientId,
        withdrawal: {
          id: generateId(),
          amount: parseFloat(formData.amount),
          date: new Date().toISOString(),
          note: formData.note.trim() || undefined,
        },
      },
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Make Withdrawal</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-500">Available Balance</p>
            <p className="text-xl font-bold text-green-600">
              ${availableBalance.toFixed(2)}
            </p>
          </div>

          <Input
            label="Withdrawal Amount ($)"
            name="amount"
            type="number"
            value={formData.amount}
            onChange={handleChange}
            placeholder="Enter amount to withdraw"
            min="0.01"
            step="0.01"
            max={availableBalance}
            fullWidth
            error={errors.amount}
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note (Optional)
            </label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              placeholder="Add a note for this withdrawal"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Withdraw
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default WithdrawalForm;