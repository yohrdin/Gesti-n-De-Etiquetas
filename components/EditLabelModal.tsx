import React, { useState, useEffect } from 'react';
import Button from './Button';
import { XMarkIcon } from './icons';
import { Category, CATEGORIES, LabelStock } from '../types';

interface EditLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (labelId: string, newName: string, newCategory: Category) => void;
  label: LabelStock;
}

const EditLabelModal: React.FC<EditLabelModalProps> = ({ isOpen, onClose, onConfirm, label }) => {
  const sortedCategories = [...CATEGORIES].sort((a, b) => a.localeCompare(b, 'es'));
  
  const [name, setName] = useState(label.name);
  const [category, setCategory] = useState<Category>(label.category);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(label.name);
      setCategory(label.category);
      setError('');
    }
  }, [isOpen, label]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!name.trim()) {
      setError('El nombre de la etiqueta no puede estar vacío.');
      return;
    }
    onConfirm(label.id, name.trim(), category);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md transform transition-all">
        <div className="flex justify-between items-center p-4 border-b dark:border-slate-700">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">Editar Etiqueta</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="name-edit" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Nombre de la Etiqueta
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="name-edit"
                id="name-edit"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:border-[#03BDC0] focus:ring-[#03BDC0] sm:text-sm"
                autoFocus
              />
            </div>
          </div>
           <div>
            <label htmlFor="category-edit" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Categoría
            </label>
            <div className="mt-1">
               <select
                id="category-edit"
                name="category-edit"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:border-[#03BDC0] focus:ring-[#03BDC0] sm:text-sm capitalize"
              >
                {sortedCategories.map(cat => <option key={cat} value={cat} className="capitalize">{cat}</option>)}
              </select>
            </div>
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 sm:px-6 flex flex-row-reverse gap-3">
          <Button onClick={handleConfirm} variant="primary">
            Guardar Cambios
          </Button>
          <Button onClick={onClose} variant="secondary">
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditLabelModal;
