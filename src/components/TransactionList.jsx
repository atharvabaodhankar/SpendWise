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
      <div className="statement-card text-center p-12 flex flex-col items-center justify-center min-h-[250px]">
        <div className="w-14 h-14 mb-4 bg-[var(--slate-faint)] rounded-lg flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-[var(--slate-light)]" />
        </div>
        <h3 className="text-base font-semibold text-[var(--navy)] mb-1">No transactions recorded</h3>
        <p className="text-xs text-[var(--slate-light)] max-w-sm">Add your first income or expense entry to start building your ledger statement.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {currentTransactions.map((transaction) => {
        const dateObj = new Date(transaction.date);
        const day = dateObj.getDate().toString().padStart(2, '0');
        const monthStr = dateObj.toLocaleString('en-IN', { month: 'short' }).toUpperCase();
        const formattedDate = `${day} ${monthStr}`;

        return (
          <div 
            key={transaction.id} 
            className="ledger-row group"
          >
            {/* Date Column */}
            <div className="font-mono text-[11px] text-[var(--slate-light)] w-[54px] flex-shrink-0">
              {formattedDate}
            </div>

            {/* Description & Category */}
            <div className="flex-shrink-0 min-w-0 max-w-[200px] sm:max-w-[280px]">
              <div className="text-[14px] font-semibold text-[var(--navy)] truncate tracking-[-0.1px]">
                {transaction.description || transaction.category}
              </div>
              <div className="text-[10px] tracking-[1px] uppercase text-[var(--slate-light)] mt-0.5 font-sans">
                {transaction.category}
              </div>
            </div>

            {/* Dashed Leader Line */}
            <div className="flex-1 border-b border-dashed border-[var(--slate-faint)] -mb-1 min-w-[20px]"></div>

            {/* Amount (Tabular Numbers) */}
            <div className={`font-mono text-[15px] font-semibold tabular-nums whitespace-nowrap ${
              transaction.type === 'income' ? 'text-[var(--emerald-dark)]' : 'text-[var(--rose)]'
            }`}>
              {transaction.type === 'income' ? '+' : '−'}₹{parseFloat(transaction.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>

            {/* Method Pill */}
            <div className="method-pill hidden sm:inline-block">
              {transaction.paymentMethod || 'Online'}
            </div>

            {/* Delete Trigger */}
            <button
              onClick={() => onDelete(transaction)}
              className="p-1.5 rounded-md text-[var(--slate-light)] hover:text-[var(--rose)] hover:bg-[var(--rose-faint)] sm:opacity-0 sm:group-hover:opacity-100 opacity-100 transition-all flex-shrink-0"
              title="Delete record"
              aria-label="Delete transaction"
            >
              <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>
        );
      })}

      {/* Statement Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center pt-6 mt-4 border-t border-[var(--hairline)]">
          <span className="font-mono text-[11px] text-[var(--slate-light)]">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn-statement text-[10px] py-1.5 px-3 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="btn-statement text-[10px] py-1.5 px-3 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}