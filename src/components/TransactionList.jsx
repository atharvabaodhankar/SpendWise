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
      <div className="glass-card text-center p-12 animate-slide-up flex flex-col items-center justify-center min-h-[300px] border border-white/10">
        <div className="w-20 h-20 mb-6 bg-[#10b981]/15 border border-[#10b981]/30 rounded-2xl flex items-center justify-center">
          <TrendingUp className="w-10 h-10 text-[#10b981]" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Geist, sans-serif' }}>No transactions recorded</h3>
        <p className="text-[#94a3b8] max-w-sm">Add your first income, expense, or bill split to start building your ledger.</p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden animate-slide-up border border-white/10">
      {/* List Header */}
      <div className="px-6 py-5 border-b border-white/10 bg-[#0b1326]/50 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
             <div className="p-2.5 bg-[#6366f1]/15 border border-[#6366f1]/30 rounded-xl">
                <Filter className="w-5 h-5 text-[#818cf8]" />
             </div>
             <div>
                <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Geist, sans-serif' }}>Transactions</h3>
                <p className="text-xs text-[#94a3b8]" style={{ fontFamily: 'Geist, sans-serif' }}>{transactions.length} entries recorded</p>
             </div>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
               <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-all text-[#94a3b8] hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
               </button>
               <span className="text-xs font-semibold px-3 text-white" style={{ fontFamily: 'Geist, sans-serif' }}>
                  {startIndex + 1}-{Math.min(endIndex, transactions.length)}
               </span>
               <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-all text-[#94a3b8] hover:text-white"
                >
                  <ChevronRight className="w-4 h-4" />
               </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Transactions List */}
      <div className="divide-y divide-white/5">
        {currentTransactions.map((transaction, index) => (
          <div 
            key={transaction.id} 
            className="group px-4 sm:px-6 py-4 hover:bg-white/[0.03] transition-all duration-200 cursor-default"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center justify-between">
              {/* Left Side: Icon & Details */}
              <div className="flex items-center gap-4 overflow-hidden">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border ${
                  transaction.type === 'income' 
                    ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30' 
                    : 'bg-[#6366f1]/15 text-[#818cf8] border-[#6366f1]/30'
                }`}>
                  {transaction.type === 'income' ? (
                    <TrendingUp className="w-5 h-5" />
                  ) : (
                    <TrendingDown className="w-5 h-5" />
                  )}
                </div>
                
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-white truncate" style={{ fontFamily: 'Geist, sans-serif' }}>
                    {transaction.description || transaction.category}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-[#64748b] font-medium" style={{ fontFamily: 'Geist, sans-serif' }}>
                       {new Date(transaction.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-white/20"></span>
                    <span className="text-xs text-[#94a3b8] truncate">{transaction.category}</span>
                  </div>
                </div>
              </div>
              
              {/* Right Side: Amount & Actions */}
              <div className="flex items-center gap-4 pl-4 flex-shrink-0">
                <div className="text-right">
                   <p className={`text-base font-extrabold ${
                      transaction.type === 'income' ? 'text-[#10b981]' : 'text-white'
                   }`} style={{ fontFamily: 'Geist, sans-serif' }}>
                      {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                   </p>
                   <div className="flex items-center justify-end gap-1.5 mt-1">
                      {transaction.paymentMethod === 'online' ? (
                        <span className="badge badge-indigo">Online</span>
                      ) : (
                        <span className="badge badge-success">Cash</span>
                      )}
                      {transaction.isBalanceAdjustment && (
                         <span className="badge badge-warning">Adjustment</span>
                      )}
                   </div>
                </div>
                
                <button
                  onClick={() => onDelete(transaction)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-[#64748b] hover:text-[#f43f5e] hover:bg-[#f43f5e]/15 transition-all sm:opacity-0 sm:group-hover:opacity-100"
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
         <div className="p-4 bg-[#0b1326]/50 border-t border-white/10 sm:hidden">
            <div className="flex justify-between items-center text-sm text-[#94a3b8]">
               <span>Page {currentPage} of {totalPages}</span>
               <div className="flex gap-2">
                  <button
                     onClick={() => goToPage(currentPage - 1)}
                     disabled={currentPage === 1}
                     className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white disabled:opacity-30"
                  >
                     Prev
                  </button>
                  <button
                     onClick={() => goToPage(currentPage + 1)}
                     disabled={currentPage === totalPages}
                     className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white disabled:opacity-30"
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