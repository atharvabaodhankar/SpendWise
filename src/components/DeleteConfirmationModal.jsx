import { AlertTriangle, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function DeleteConfirmationModal({ transaction, onConfirm, onCancel }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (transaction) {
      // Small delay to trigger animation
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
    }
  }, [transaction]);

  if (!transaction) return null;

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto transition-all duration-300 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div 
          className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`} 
          onClick={onCancel}
        ></div>
        
        <div className={`relative transform overflow-hidden rounded-2xl bg-white/95 backdrop-blur-md text-left shadow-2xl transition-all duration-300 sm:my-8 sm:w-full sm:max-w-lg ${
          isVisible 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 translate-y-4 scale-95'
        }`}>
          <div className="bg-white/90 backdrop-blur-sm px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-rose-600 shadow-lg sm:mx-0 sm:h-12 sm:w-12 transition-all duration-500 ${
                isVisible ? 'scale-100 rotate-0' : 'scale-0 rotate-180'
              }`}>
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold leading-6 text-gray-900">
                      Delete Transaction
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">This action cannot be undone</p>
                  </div>
                  <button
                    onClick={onCancel}
                    className="rounded-xl bg-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-2 transition-all duration-200 hover:scale-105"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className={`transition-all duration-500 delay-200 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}>
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 mb-4 border border-gray-200/50 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-semibold text-gray-900 text-base">
                        {transaction.description || transaction.category}
                      </span>
                      <span className={`font-bold text-xl ${
                        transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
                      <span className="font-medium">{transaction.category}</span>
                      <span>{new Date(transaction.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}</span>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                      transaction.paymentMethod === 'online' 
                        ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                        : 'bg-purple-100 text-purple-800 border border-purple-200'
                    }`}>
                      {transaction.paymentMethod === 'online' ? '💳 Online' : '💵 Cash'}
                    </span>
                  </div>
                  
                  <div className={`bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 shadow-sm transition-all duration-500 delay-300 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}>
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-amber-800">
                          <strong className="font-semibold">Important:</strong> This action cannot be undone. Deleting this transaction will also adjust your current balance accordingly.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={`bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-4 sm:flex sm:flex-row-reverse sm:px-6 transition-all duration-500 delay-400 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:from-red-700 hover:to-rose-700 hover:shadow-xl transform hover:scale-105 transition-all duration-200 sm:ml-3 sm:w-auto"
              onClick={onConfirm}
            >
              Delete Transaction
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-md ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover:shadow-lg transform hover:scale-105 transition-all duration-200 sm:mt-0 sm:w-auto"
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}