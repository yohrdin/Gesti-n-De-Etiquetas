import React, { useState, useEffect } from 'react';
import { LabelStock, TransactionType } from '../types';
import Button from './Button';
import { XMarkIcon } from './icons';

interface StockModalProps {
  isOpen: boolean;
  onClose: () => void;
  label: LabelStock;
  type: 'ingreso' | 'salida';
  onConfirm: (labelId: string, type: TransactionType, quantity: number, sampleQuantity: number) => void;
}

const StockModal: React.FC<StockModalProps> = ({ isOpen, onClose, label, type, onConfirm }) => {
  const [quantity, setQuantity] = useState<number | string>('');
  const [sampleQuantity, setSampleQuantity] = useState<number | string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setQuantity('');
      setSampleQuantity('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const numQuantity = Number(quantity) || 0;
    const numSampleQuantity = Number(sampleQuantity) || 0;

    if (numQuantity <= 0 && numSampleQuantity <= 0) {
        setError('Por favor, ingresa una cantidad válida y mayor a cero.');
        return;
    }

    if (numQuantity < 0 || numSampleQuantity < 0) {
        setError('Las cantidades no pueden ser negativas.');
        return;
    }

    if (type === 'salida') {
        if (numQuantity > label.quantity) {
            setError(`No puedes retirar más de ${label.quantity.toLocaleString()} unidades.`);
            return;
        }
        if (numSampleQuantity > label.sampleQuantity) {
            setError(`No puedes retirar más de ${label.sampleQuantity.toLocaleString()} muestras.`);
            return;
        }
    }
    
    onConfirm(label.id, type, numQuantity, numSampleQuantity);
  };
  
  const modalTitle = type === 'ingreso' ? 'Registrar Ingreso de Stock' : 'Registrar Salida de Stock';
  const buttonVariant = type === 'ingreso' ? 'success' : 'danger';
  const buttonLabel = type === 'ingreso' ? 'Confirmar Ingreso' : 'Confirmar Salida';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md transform transition-all">
        <div className="flex justify-between items-center p-4 border-b dark:border-slate-700">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">{modalTitle}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Etiqueta</p>
            <p className="font-semibold text-slate-800 dark:text-slate-200">{label.name}</p>
             <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{label.category}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Stock actual: <span className="font-bold">{label.quantity.toLocaleString()}</span> uds.
                {label.sampleQuantity > 0 && ` (+ ${label.sampleQuantity.toLocaleString()} muestras)`}
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Cantidad (Unidades Normales)
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  name="quantity"
                  id="quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:border-[#03BDC0] focus:ring-[#03BDC0] sm:text-sm"
                  placeholder="0"
                  autoFocus
                />
              </div>
            </div>

            {(type === 'ingreso' || (type === 'salida' && label.sampleQuantity > 0)) && (
              <div>
                <label htmlFor="sample-quantity" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Cantidad de Muestras (Opcional)
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="sample-quantity"
                    id="sample-quantity"
                    value={sampleQuantity}
                    onChange={(e) => setSampleQuantity(e.target.value)}
                    className="block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:border-[#03BDC0] focus:ring-[#03BDC0] sm:text-sm"
                    placeholder="0"
                  />
                </div>
              </div>
            )}
            {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 sm:px-6 flex flex-row-reverse gap-3">
          <Button onClick={handleConfirm} variant={buttonVariant}>
            {buttonLabel}
          </Button>
          <Button onClick={onClose} variant="secondary">
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StockModal;