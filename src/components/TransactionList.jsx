import { Trash2, TrendingUp, TrendingDown } from 'lucide-react';

export default function TransactionList({ transactions, onDelete }) {
  if (transactions.length === 0) {
    return (
      <div className="premium-card text-center p-12 animate-fade-scale">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center">
          <span className="text-3xl">📊</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No transactions yet</h3>
        <p className="text-gray-500">Add your first transaction to get started with tracking your finances!</p>
      </div>
    );
  }

  return (
    <div className="premium-card overflow-hidden animate-slide-up">
      <div className="px-6 py-5 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200/50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-sm font-bold">📋</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Recent Transactions</h2>
            <p className="text-sm text-gray-500">{transactions.length} transactions</p>
          </div>
        </div>
      </div>
      
      <div className="divide-y divide-gray-100">
        {transactions.map((transaction, index) => (
          <div 
            key={transaction.id} 
            className="px-6 py-5 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/30 transition-all duration-300 group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300 ${
                  transaction.type === 'income' 
                    ? 'bg-gradient-to-r from-emerald-100 to-green-100' 
                    : 'bg-gradient-to-r from-rose-100 to-red-100'
                }`}>
                  {transaction.type === 'income' ? (
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-rose-600" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-gray-900 truncate">
                    {transaction.description || transaction.category}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {transaction.category} • {new Date(transaction.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      transaction.paymentMethod === 'online' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {transaction.paymentMethod === 'online' ? '💳 Online' : '💵 Cash'}
                    </span>
                    {transaction.isBalanceAdjustment && (
                      <span className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
                        ⚙️ Adjustment
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <span className={`text-xl font-bold ${
                    transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                  </span>
                </div>
                
                <button
                  onClick={() => onDelete(transaction.id)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200 opacity-0 group-hover:opacity-100"
                  title="Delete transaction"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}