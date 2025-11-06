
import React from 'react';
import { Transaction } from '../types';
import Card from './Card';
import { ArrowUpRightIcon, ArrowDownLeftIcon } from './icons';

interface HistoryLogProps {
  history: Transaction[];
}

const HistoryLog: React.FC<HistoryLogProps> = ({ history }) => {
  const formatDate = (date: Date) => {
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderTransactionDetails = (tx: Transaction) => {
    const sign = tx.type === 'ingreso' ? '+' : '-';
    const parts = [];
    if (tx.quantity > 0) {
        parts.push(`${tx.quantity.toLocaleString()} unidades`);
    }
    if (tx.sampleQuantity && tx.sampleQuantity > 0) {
        parts.push(`${tx.sampleQuantity.toLocaleString()} muestras`);
    }
    
    const details = parts.join(' y ');
    const typeText = ` (${tx.type})`;
    
    return `${sign}${details}${typeText}`;
  };

  return (
    <Card>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Historial de Movimientos</h2>
      {history.length > 0 ? (
        <ul className="space-y-4">
          {history.map((tx) => (
            <li key={tx.id} className="flex items-start space-x-3">
              <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                  tx.type === 'ingreso' ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'
              }`}>
                {tx.type === 'ingreso' ? (
                  <ArrowUpRightIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <ArrowDownLeftIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{tx.labelName}</p>
                <p className={`text-sm ${
                    tx.type === 'ingreso' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {renderTransactionDetails(tx)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(tx.timestamp)}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-10">
          No hay movimientos registrados.
        </div>
      )}
    </Card>
  );
};

export default HistoryLog;