import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { X } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import { generateId } from '../../utils/grillUtils';
import { addDays, addWeeks, addMonths, addYears } from 'date-fns';

interface TontineFormProps {
  groupId?: string | null;
  onClose: () => void;
}

const TontineForm: React.FC<TontineFormProps> = ({ groupId, onClose }) => {
  const { state, dispatch } = useAppContext();
  const [formData, setFormData] = useState({
    name: '',
    contributionAmount: '',
    memberCount: '',
    interval: 'monthly',
    customInterval: '',
    startDate: '',
    description: '',
    members: [] as { clientId: string; payoutOrder: number }[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (groupId) {
      const group = state.tontineGroups.find(g => g.id === groupId);
      if (group) {
        setFormData({
          name: group.name,
          contributionAmount: group.contributionAmount.toString(),
          memberCount: group.memberCount.toString(),
          interval: group.interval,
          customInterval: group.customInterval?.toString() || '',
          startDate: group.startDate.split('T')[0],
          description: group.description || '',
          members: group.members.map(m => ({
            clientId: m.clientId,
            payoutOrder: m.payoutOrder,
          })),
        });
      }
    }
  }, [groupId, state.tontineGroups]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.contributionAmount || parseFloat(formData.contributionAmount) <= 0) {
      newErrors.contributionAmount = 'Valid contribution amount is required';
    }
    if (!formData.memberCount || parseInt(formData.memberCount) <= 1) {
      newErrors.memberCount = 'At least 2 members are required';
    }
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (formData.interval === 'custom' && (!formData.customInterval || parseInt(formData.customInterval) <= 0)) {
      newErrors.customInterval = 'Please enter valid number of days for custom interval';
    }
    if (formData.members.length > 0 && formData.members.length !== parseInt(formData.memberCount)) {
      newErrors.members = 'Member count must match selected members';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateNextDate = (currentDate: Date, interval: string, customDays?: number): Date => {
    switch (interval) {
      case 'daily':
        return addDays(currentDate, 1);
      case 'weekly':
        return addWeeks(currentDate, 1);
      case '2-weeks':
        return addWeeks(currentDate, 2);
      case '3-weeks':
        return addWeeks(currentDate, 3);
      case 'monthly':
        return addMonths(currentDate, 1);
      case '2-months':
        return addMonths(currentDate, 2);
      case 'trimester':
        return addMonths(currentDate, 3);
      case 'semester':
        return addMonths(currentDate, 6);
      case 'yearly':
        return addYears(currentDate, 1);
      case 'custom':
        return addDays(currentDate, customDays || 1);
      default:
        return addMonths(currentDate, 1);
    }
  };

  const generatePayoutDates = (startDate: Date, memberCount: number, interval: string, customDays?: number): Date[] => {
    const dates: Date[] = [];
    let currentDate = startDate;

    for (let i = 0; i < memberCount; i++) {
      dates.push(currentDate);
      currentDate = calculateNextDate(currentDate, interval, customDays);
    }
    return dates;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const startDate = new Date(formData.startDate);
    const memberCount = parseInt(formData.memberCount);
    const customDays = formData.interval === 'custom' ? parseInt(formData.customInterval) : undefined;
    const payoutDates = generatePayoutDates(startDate, memberCount, formData.interval, customDays);

    const tontineGroup = {
      id: groupId || generateId(),
      name: formData.name,
      contributionAmount: parseFloat(formData.contributionAmount),
      memberCount: memberCount,
      interval: formData.interval as TontineGroup['interval'],
      customInterval: customDays,
      startDate: startDate.toISOString(),
      description: formData.description || undefined,
      status: 'pending' as const,
      members: formData.members.map((member, index) => ({
        id: generateId(),
        clientId: member.clientId,
        payoutOrder: member.payoutOrder,
        payoutDate: payoutDates[index].toISOString(),
        hasPaidOut: false,
        contributions: [],
      })),
    };

    if (groupId) {
      dispatch({ type: 'UPDATE_TONTINE_GROUP', payload: tontineGroup });
    } else {
      dispatch({ type: 'ADD_TONTINE_GROUP', payload: tontineGroup });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {groupId ? 'Edit Tontine Group' : 'Create Tontine Group'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Group Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter group name"
              fullWidth
              error={errors.name}
            />

            <Input
              label="Contribution Amount ($)"
              name="contributionAmount"
              type="number"
              value={formData.contributionAmount}
              onChange={handleChange}
              placeholder="Enter contribution amount"
              min="0.01"
              step="0.01"
              fullWidth
              error={errors.contributionAmount}
            />

            <Input
              label="Number of Members"
              name="memberCount"
              type="number"
              value={formData.memberCount}
              onChange={handleChange}
              placeholder="Enter number of members"
              min="2"
              fullWidth
              error={errors.memberCount}
            />

            <Select
              label="Contribution Interval"
              name="interval"
              value={formData.interval}
              onChange={handleChange}
              options={[
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: '2-weeks', label: '2 Weeks' },
                { value: '3-weeks', label: '3 Weeks' },
                { value: 'monthly', label: 'Monthly' },
                { value: '2-months', label: '2 Months' },
                { value: 'trimester', label: 'Trimester (3 Months)' },
                { value: 'semester', label: 'Semester (6 Months)' },
                { value: 'yearly', label: 'Yearly' },
                { value: 'custom', label: 'Custom' },
              ]}
              fullWidth
            />

            {formData.interval === 'custom' && (
              <Input
                label="Custom Interval (Days)"
                name="customInterval"
                type="number"
                value={formData.customInterval}
                onChange={handleChange}
                placeholder="Enter number of days"
                min="1"
                fullWidth
                error={errors.customInterval}
              />
            )}

            <Input
              label="Start Date"
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={handleChange}
              fullWidth
              error={errors.startDate}
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter group description"
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              rows={3}
            />
          </div>

          {errors.members && (
            <p className="mt-2 text-sm text-red-600">{errors.members}</p>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {groupId ? 'Update Group' : 'Create Group'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TontineForm;