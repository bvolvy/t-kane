import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Grill } from '../../types';
import { generateId } from '../../utils/grillUtils';
import Button from '../common/Button';
import Input from '../common/Input';
import { X } from 'lucide-react';

interface GrillFormProps {
  grill?: Grill;
  onClose: () => void;
}

const GrillForm: React.FC<GrillFormProps> = ({ grill, onClose }) => {
  const { dispatch } = useAppContext();
  const [formData, setFormData] = useState({
    name: '',
    baseAmount: 0,
    duration: 90,
    description: '',
    adminPercentage: 10,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (grill) {
      setFormData({
        name: grill.name,
        baseAmount: grill.baseAmount,
        duration: grill.duration,
        description: grill.description || '',
        adminPercentage: grill.adminPercentage || 10,
      });
    }
  }, [grill]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const parsedValue = name === 'baseAmount' || name === 'duration' || name === 'adminPercentage'
      ? parseFloat(value) || 0 
      : value;
    
    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
    
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (formData.baseAmount <= 0) newErrors.baseAmount = 'Base amount must be greater than 0';
    if (formData.duration <= 0) newErrors.duration = 'Duration must be greater than 0';
    if (formData.duration > 90) newErrors.duration = 'Maximum duration is 90 days';
    if (formData.adminPercentage < 0) newErrors.adminPercentage = 'Admin percentage cannot be negative';
    if (formData.adminPercentage > 100) newErrors.adminPercentage = 'Admin percentage cannot exceed 100%';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (grill) {
      // Update existing grill
      const updatedGrill: Grill = {
        ...grill,
        name: formData.name,
        baseAmount: formData.baseAmount,
        duration: formData.duration,
        description: formData.description,
        adminPercentage: formData.adminPercentage,
      };
      dispatch({ type: 'UPDATE_GRILL', payload: updatedGrill });
    } else {
      // Create new grill
      const newGrill: Grill = {
        id: generateId(),
        name: formData.name,
        baseAmount: formData.baseAmount,
        duration: formData.duration,
        description: formData.description,
        adminPercentage: formData.adminPercentage,
      };
      dispatch({ type: 'ADD_GRILL', payload: newGrill });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {grill ? 'Edit Grill Template' : 'Create Grill Template'}
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
            label="Template Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter grill template name"
            fullWidth
            error={errors.name}
          />

          <Input
            label="Base Amount ($)"
            name="baseAmount"
            type="number"
            value={formData.baseAmount.toString()}
            onChange={handleChange}
            placeholder="Enter base amount per day"
            min="0.01"
            step="0.01"
            fullWidth
            error={errors.baseAmount}
          />

          <Input
            label="Duration (Days)"
            name="duration"
            type="number"
            value={formData.duration.toString()}
            onChange={handleChange}
            placeholder="Enter duration in days"
            min="1"
            max="90"
            fullWidth
            error={errors.duration}
          />

          <Input
            label="Admin Percentage (%)"
            name="adminPercentage"
            type="number"
            value={formData.adminPercentage.toString()}
            onChange={handleChange}
            placeholder="Enter admin percentage"
            min="0"
            max="100"
            step="0.1"
            fullWidth
            error={errors.adminPercentage}
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter description"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {grill ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GrillForm;