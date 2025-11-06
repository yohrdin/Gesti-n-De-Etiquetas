import React from 'react';
import { LabelStock, ModalType } from '../types';
import Card from './Card';
import Button from './Button';
import { PlusIcon, MinusIcon, PackageIcon, ExclamationTriangleIcon } from './icons';

interface InventoryListProps {
  inventory: LabelStock[];
  onOpenModal: (type: ModalType, label: LabelStock) => void;
}

const LOW_STOCK_THRESHOLD = 10;

const InventoryListItem: React.FC<{item: LabelStock, onOpenModal: (type: ModalType, label: LabelStock) => void}> = ({ item, onOpenModal }) => {
    const isLowStock = item.quantity <= LOW_STOCK_THRESHOLD;

    return (
        <li className={`flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 ${isLowStock ? 'bg-amber-50 dark:bg-amber-900/20 px-4 -mx-4 rounded-lg' : ''}`}>
            <div className="flex items-center min-w-0">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-[#CCECED] dark:bg-[#014F51]/50 flex items-center justify-center">
                    <PackageIcon className="h-6 w-6 text-[#02A1A4] dark:text-[#68D4D6]" />
                </div>
                <div className="ml-4">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{item.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{item.category}</p>
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1">
                        <p className={`text-sm ${isLowStock ? 'text-amber-700 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
                            <span className={`font-bold text-lg ${isLowStock ? 'text-amber-600 dark:text-amber-300' : 'text-[#02A1A4] dark:text-[#35C8CB]'}`}>{item.quantity.toLocaleString()}</span> uds. en stock
                        </p>
                        {item.sampleQuantity > 0 && (
                            <span className="text-sm text-slate-500 dark:text-slate-400">(+ {item.sampleQuantity.toLocaleString()} muestras)</span>
                        )}
                        {isLowStock && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                                <ExclamationTriangleIcon className="h-4 w-4 mr-1"/>
                                Stock Bajo
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <div className="mt-4 sm:mt-0 flex-shrink-0 flex gap-2">
                <Button onClick={() => onOpenModal('ingreso', item)} variant="success" className="px-3 py-1.5">
                    <PlusIcon className="h-5 w-5 mr-1" /> Ingreso
                </Button>
                <Button onClick={() => onOpenModal('salida', item)} variant="danger" className="px-3 py-1.5">
                    <MinusIcon className="h-5 w-5 mr-1" /> Salida
                </Button>
            </div>
        </li>
    )
}


const InventoryList: React.FC<InventoryListProps> = ({ inventory, onOpenModal }) => {
  const lowStockItems = inventory
    .filter(item => item.quantity <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.name.localeCompare(b.name));

  const normalStockItems = inventory
    .filter(item => item.quantity > LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.name.localeCompare(b.name));
    
  const sortedInventory = [...lowStockItems, ...normalStockItems];

  return (
    <Card>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Inventario Actual</h2>
      {inventory.length > 0 ? (
        <ul className="divide-y divide-slate-200 dark:divide-slate-700">
          {sortedInventory.map((item) => (
            <InventoryListItem key={item.id} item={item} onOpenModal={onOpenModal}/>
          ))}
        </ul>
      ) : (
        <div className="text-center py-10">
          <PackageIcon className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">No hay etiquetas en el inventario</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Comienza agregando una nueva etiqueta.</p>
        </div>
      )}
    </Card>
  );
};

export default InventoryList;