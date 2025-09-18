import { useState } from 'react';
import { X } from 'lucide-react';

const categories = ['Food', 'Transportation', 'Entertainment', 'Bills', 'Shopping', 'Healthcare', 'Other'];

export default function TransactionForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    type: 'expense', // Always expense now
    amount: '',
    category: 'Food',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'online'
  });

  // Check if the selected date is in the past (not today)
  const isHistoricalDate = () => {
    const today = new Date().toISOString().split('T')[0];
    return formData.date < today;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount),
      isHistorical: isHistoricalDate() // Flag to indicate if this is a historical transaction
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-scale">
      <div className="premium-card w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="p-6 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg font-bold">+</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Add Expense</h2>
                <p className="text-sm text-gray-500">Record your expense transaction</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  className="premium-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="premium-input w-full"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="premium-input w-full"
              >
                <option value="online">💳 Online</option>
                <option value="cash">💵 Cash</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Optional description..."
                className="premium-input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date
                {isHistoricalDate() && (
                  <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
                    Historical
                  </span>
                )}
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className={`premium-input w-full ${isHistoricalDate() ? 'border-amber-300 bg-amber-50' : ''}`}
              />
              {isHistoricalDate() && (
                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-600 text-sm">⚡</span>
                    <div className="text-xs text-amber-700">
                      <p className="font-medium mb-1">Smart Historical Mode:</p>
                      <p>• Current balance stays unchanged (₹{formData.paymentMethod === 'online' ? 'Online' : 'Cash'} balance preserved)</p>
                      <p>• Transaction recorded for expense tracking only</p>
                      <p>• Expense recorded for tracking only</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-4 pt-6">
              <button
                type="submit"
                className="flex-1 btn-primary py-4 text-base font-semibold"
              >
                Add Expense
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 btn-secondary py-4 text-base font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}