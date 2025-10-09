import { useState } from 'react';
import { Trash2, TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react';

export default function TransactionList({ transactions, onDelete }) {
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 10;
  
  // Calculate pagination
  const totalPages = Math.ceil(transactions.length / transactionsPerPage);
  const startIndex = (currentPage - 1) * transactionsPerPage;
  const endIndex = startIndex + transactionsPerPage;
  const currentTransactions = transactions.slice(startIndex, endIndex);
  
  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };
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
      <div className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-sm font-bold">📋</span>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Recent Transactions</h2>
              <p className="text-xs sm:text-sm text-gray-500">
                {transactions.length} total • Showing {Math.min(startIndex + 1, transactions.length)}-{Math.min(endIndex, transactions.length)}
              </p>
            </div>
          </div>
          
          {totalPages > 1 && (
            <div className="hidden sm:flex items-center space-x-1 text-xs text-gray-500">
              <span>Page {currentPage} of {totalPages}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="divide-y divide-gray-100">
        {currentTransactions.map((transaction, index) => (
          <div 
            key={transaction.id} 
            className="px-4 sm:px-6 py-4 sm:py-5 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/30 transition-all duration-300 group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start sm:items-center justify-between space-x-3">
              <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300 flex-shrink-0 ${
                  transaction.type === 'income' 
                    ? 'bg-gradient-to-r from-emerald-100 to-green-100' 
                    : 'bg-gradient-to-r from-rose-100 to-red-100'
                }`}>
                  {transaction.type === 'income' ? (
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-rose-600" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                    {transaction.description || transaction.category}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    {transaction.category} • {new Date(transaction.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={`text-xs px-2 sm:px-3 py-1 rounded-full font-medium ${
                      transaction.paymentMethod === 'online' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {transaction.paymentMethod === 'online' ? '💳 Online' : '💵 Cash'}
                    </span>
                    {transaction.isBalanceAdjustment && (
                      <span className="text-xs px-2 sm:px-3 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
                        ⚙️ Adjustment
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 flex-shrink-0">
                <div className="text-right">
                  <span className={`text-lg sm:text-xl font-bold ${
                    transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                  </span>
                </div>
                
                <button
                  onClick={() => onDelete(transaction)}
                  className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg sm:rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200 sm:opacity-0 sm:group-hover:opacity-100"
                  title="Delete transaction"
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="px-4 sm:px-6 py-4 bg-gray-50/50 border-t border-gray-200/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Previous</span>
              </button>
              
              <div className="flex items-center space-x-1">
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`w-8 h-8 text-sm font-medium rounded-lg transition-all duration-200 ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="text-gray-400 px-1">...</span>
                    <button
                      onClick={() => goToPage(totalPages)}
                      className="w-8 h-8 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-all duration-200"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>
              
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            
            <div className="text-xs text-gray-500 sm:hidden">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        </div>
      )}


    </div>
  );
}