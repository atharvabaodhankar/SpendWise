import { useState } from 'react';
import { Trash2, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';

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
      <div className="premium-card text-center p-12 animate-fade-scale flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-20 h-20 mb-6 bg-[var(--primary-50)] rounded-full flex items-center justify-center">
          <TrendingUp className="w-10 h-10 text-[var(--primary-300)]" />
        </div>
        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No transactions yet</h3>
        <p className="text-[var(--text-secondary)] max-w-sm">Add your first income or expense to start tracking your financial journey.</p>
      </div>
    );
  }

  return (
    <div className="premium-card overflow-hidden animate-slide-up">
      {/* List Header */}
      <div className="px-6 py-5 border-b border-[var(--card-border)] bg-[var(--bg-secondary)]/50 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
             <div className="p-2 bg-[var(--primary-100)] rounded-lg">
                <Filter className="w-5 h-5 text-[var(--primary-600)]" />
             </div>
             <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Transactions</h3>
                <p className="text-xs text-[var(--text-secondary)]">{transactions.length} records found</p>
             </div>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center bg-[var(--bg-tertiary)] rounded-lg p-1">
               <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-md hover:bg-[var(--card-bg)] hover:shadow-sm disabled:opacity-30 transition-all text-[var(--text-secondary)]"
                >
                  <ChevronLeft className="w-4 h-4" />
               </button>
               <span className="text-xs font-semibold px-3 text-[var(--text-primary)]">
                  {startIndex + 1}-{Math.min(endIndex, transactions.length)}
               </span>
               <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-md hover:bg-[var(--card-bg)] hover:shadow-sm disabled:opacity-30 transition-all text-[var(--text-secondary)]"
                >
                  <ChevronRight className="w-4 h-4" />
               </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Transactions List */}
      <div className="divide-y divide-[var(--card-border)]">
        {currentTransactions.map((transaction, index) => (
          <div 
            key={transaction.id} 
            className="group px-4 sm:px-6 py-4 hover:bg-[var(--bg-tertiary)] transition-all duration-200 cursor-default"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center justify-between">
              {/* Left Side: Icon & Details */}
              <div className="flex items-center gap-4 overflow-hidden">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                  transaction.type === 'income' 
                    ? 'bg-[var(--success-50)] text-[var(--success-600)]' 
                    : 'bg-[var(--primary-100)] text-[var(--primary-600)]'
                }`}>
                  {transaction.type === 'income' ? (
                    <TrendingUp className="w-5 h-5" />
                  ) : (
                    <TrendingDown className="w-5 h-5" />
                  )}
                </div>
                
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-[var(--text-primary)] truncate">
                    {transaction.description || transaction.category}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-[var(--text-tertiary)] font-medium">
                       {new Date(transaction.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-[var(--primary-300)]"></span>
                    <span className="text-xs text-[var(--text-secondary)] truncate">{transaction.category}</span>
                  </div>
                </div>
              </div>
              
              {/* Right Side: Amount & Actions */}
              <div className="flex items-center gap-4 pl-4 flex-shrink-0">
                <div className="text-right">
                   <p className={`text-base font-bold ${
                      transaction.type === 'income' ? 'text-[var(--success-600)]' : 'text-[var(--text-primary)]'
                   }`}>
                      {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                   </p>
                   <div className="flex items-center justify-end gap-1.5 mt-0.5">
                      {transaction.paymentMethod === 'online' ? (
                        <span className="badge bg-[var(--accent-50)] text-[var(--accent-700)]">Online</span>
                      ) : (
                        <span className="badge bg-[var(--primary-100)] text-[var(--primary-700)]">Cash</span>
                      )}
                      {transaction.isBalanceAdjustment && (
                         <span className="badge bg-amber-50 text-amber-700">Adj</span>
                      )}
                   </div>
                </div>
                
                <button
                  onClick={() => onDelete(transaction)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-tertiary)] hover:text-[var(--danger-500)] hover:bg-[var(--danger-50)] transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Footer / Pagination for Mobile */}
      {totalPages > 1 && (
         <div className="p-4 bg-[var(--bg-tertiary)] border-t border-[var(--card-border)] sm:hidden">
            <div className="flex justify-between items-center text-sm text-[var(--text-secondary)]">
               <span>Page {currentPage} of {totalPages}</span>
               <div className="flex gap-2">
                  <button
                     onClick={() => goToPage(currentPage - 1)}
                     disabled={currentPage === 1}
                     className="px-3 py-1.5 bg-white border border-[var(--card-border)] rounded-lg disabled:opacity-50"
                  >
                     Prev
                  </button>
                  <button
                     onClick={() => goToPage(currentPage + 1)}
                     disabled={currentPage === totalPages}
                     className="px-3 py-1.5 bg-white border border-[var(--card-border)] rounded-lg disabled:opacity-50"
                  >
                     Next
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}