import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import { X } from 'lucide-react';
import { generateId } from '../../utils/grillUtils';
import { Loan } from '../../types';

interface LoanPaymentFormProps {
  loan: Loan;
  clientId: string;
  remainingPrincipal: number;
  remainingInterest: number;
  onClose: () => void;
}

const LoanPaymentForm: React.FC<LoanPaymentFormProps> = ({ 
  loan, 
  clientId, 
  remainingPrincipal,
  remainingInterest,
  onClose 
}) => {
  const { dispatch } = useAppContext();
  const [formData, setFormData] = useState({
    amount: '',
    type: 'principal',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const amount = parseFloat(formData.amount);
    const maxAmount = formData.type === 'principal' ? remainingPrincipal : remainingInterest;

    if (!amount || isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (amount > maxAmount) {
      newErrors.amount = `Amount cannot exceed remaining ${formData.type} (${maxAmount.toFixed(2)})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payment = {
      id: generateId(),
      amount: parseFloat(formData.amount),
      date: new Date().toISOString(),
      type: formData.type as 'principal' | 'interest',
    };

    dispatch({
      type: 'ADD_LOAN_PAYMENT',
      payload: {
        clientId,
        loanId: loan.id,
        payment,
      },
    });

    // Check if this payment completes the loan
    if (
      (formData.type === 'principal' && parseFloat(formData.amount) >= remainingPrincipal) ||
      (formData.type === 'interest' && parseFloat(formData.amount) >= remainingInterest)
    ) {
      // Only mark as paid if both principal and interest are fully paid
      const isPrincipalPaid = formData.type === 'principal' ? 
        parseFloat(formData.amount) >= remainingPrincipal : 
        remainingPrincipal === 0;
      
      const isInterestPaid = formData.type === 'interest' ? 
        parseFloat(formData.amount) >= remainingInterest : 
        remainingInterest === 0;

      if (isPrincipalPaid && isInterestPaid) {
        dispatch({
          type: 'UPDATE_LOAN_STATUS',
          payload: {
            clientId,
            loanId: loan.id,
            status: 'paid',
          },
        });
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Make Payment</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Remaining Principal</p>
              <p className="text-xl font-bold text-blue-600">
                ${remainingPrincipal.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Remaining Interest</p>
              <p className="text-xl font-bold text-purple-600">
                ${remainingInterest.toFixed(2)}
              </p>
            </div>
          </div>

          <Select
            label="Payment Type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            options={[
              { value: 'principal', label: 'Principal' },
              { value: 'interest', label: 'Interest' },
            ]}
            fullWidth
          />

          <Input
            label="Payment Amount ($)"
            name="amount"
            type="number"
            value={formData.amount}
            onChange={handleChange}
            placeholder="Enter payment amount"
            min="0.01"
            step="0.01"
            max={formData.type === 'principal' ? remainingPrincipal : remainingInterest}
            fullWidth
            error={errors.amount}
          />

          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Submit Payment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoanPaymentForm;