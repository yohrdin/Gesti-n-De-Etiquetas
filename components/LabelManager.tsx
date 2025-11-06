import React, { useState, useMemo } from 'react';
import { LabelStock, Category, CATEGORIES } from '../types';
import Card from './Card';
import Button from './Button';
import EditLabelModal from './EditLabelModal';
import { PencilIcon, DocumentArrowUpIcon, DocumentArrowDownIcon, TagIcon, TrashIcon, XMarkIcon } from './icons';

declare const XLSX: any;

interface NewLabel {
    name: string;
    category: Category;
}

interface LabelExcelImporterProps {
    onConfirm: (labels: NewLabel[]) => { success: boolean, message: string };
}

const LabelExcelImporter: React.FC<LabelExcelImporterProps> = ({ onConfirm }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError('');
            setSuccess('');
        }
    };

    const handleProcessFile = () => {
        if (!file) {
            setError('Por favor, selecciona un archivo para procesar.');
            return;
        }

        setIsProcessing(true);
        setError('');
        setSuccess('');

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json: any[] = XLSX.utils.sheet_to_json(worksheet);

                if (json.length === 0) throw new Error('El archivo Excel está vacío.');
                
                const requiredHeaders = ['Categoría', 'Nombre de la Etiqueta'];
                const headers = Object.keys(json[0]);
                for (const header of requiredHeaders) {
                    if (!headers.includes(header)) {
                        throw new Error(`Falta la columna requerida: "${header}".`);
                    }
                }

                const newLabels: NewLabel[] = json.map((row, index) => {
                    const name = row['Nombre de la Etiqueta']?.trim();
                    const category = row['Categoría']?.toLowerCase().trim();

                    if (!name || !category) {
                         throw new Error(`Error en la fila ${index + 2}: 'Nombre' y 'Categoría' no pueden estar vacíos.`);
                    }
                    if (!CATEGORIES.includes(category)) {
                        throw new Error(`Error en la fila ${index + 2}: La categoría '${category}' no es válida.`);
                    }

                    return { name, category };
                });
                
                const result = onConfirm(newLabels);

                if(result.success) {
                    setSuccess(result.message);
                    setFile(null);
                } else {
                    setError(result.message);
                }

            } catch (err: any) {
                setError(`Error al procesar el archivo: ${err.message}`);
            } finally {
                setIsProcessing(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleDownloadFormat = () => {
        const headers = ["Categoría", "Nombre de la Etiqueta"];
        const worksheet = XLSX.utils.aoa_to_sheet([headers]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Nuevas Etiquetas");
        worksheet["!cols"] = [{ wch: 20 }, { wch: 50 }];
        XLSX.writeFile(workbook, "formato_nuevas_etiquetas.xlsx");
    };

    return (
        <Card>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Registro Masivo por Excel</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Sube un archivo .xlsx con las columnas: <code className="font-mono text-xs bg-slate-100 dark:bg-slate-700 p-1 rounded">Categoría</code> y <code className="font-mono text-xs bg-slate-100 dark:bg-slate-700 p-1 rounded">Nombre de la Etiqueta</code> para agregar nuevas etiquetas al sistema.
            </p>
             <div className="mt-4">
                <button 
                    onClick={handleDownloadFormat}
                    className="inline-flex items-center text-sm font-medium text-[#02A1A4] hover:text-[#028588] dark:text-[#68D4D6] dark:hover:text-[#9AE0E2] underline"
                >
                    <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                    Descargar formato
                </button>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-4 items-center">
                 <label className="w-full sm:w-auto cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                    <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                    <span>{file ? file.name : 'Seleccionar archivo'}</span>
                    <input type="file" className="sr-only" onChange={handleFileChange} accept=".xlsx, .xls" />
                </label>
                <Button onClick={handleProcessFile} disabled={!file || isProcessing}>
                    {isProcessing ? 'Procesando...' : 'Procesar Archivo'}
                </Button>
            </div>
            <div className="h-5 mt-4">
                {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
                {success && <p className="text-sm text-green-600 dark:text-green-400">{success}</p>}
            </div>
        </Card>
    );
};


interface LabelManagerProps {
  inventory: LabelStock[];
  onEditLabel: (labelId: string, newName: string, newCategory: Category) => void;
  onBatchAddLabels: (labels: NewLabel[]) => { success: boolean, message: string };
  onDeleteLabel: (labelId: string) => { success: boolean, message: string };
}

const LabelManager: React.FC<LabelManagerProps> = ({ inventory, onEditLabel, onBatchAddLabels, onDeleteLabel }) => {
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<LabelStock | null>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [labelToDelete, setLabelToDelete] = useState<LabelStock | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');

  const sortedCategories = [...CATEGORIES].sort((a, b) => a.localeCompare(b, 'es'));

  const filteredInventory = useMemo(() => {
    return inventory
      .filter(label => {
        if (categoryFilter !== 'all' && label.category !== categoryFilter) {
          return false;
        }
        if (searchTerm && !label.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [inventory, searchTerm, categoryFilter]);


  const handleOpenEditModal = (label: LabelStock) => {
    setSelectedLabel(label);
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setSelectedLabel(null);
    setEditModalOpen(false);
  };
  
  const handleConfirmEdit = (labelId: string, newName: string, newCategory: Category) => {
    onEditLabel(labelId, newName, newCategory);
    handleCloseEditModal();
  };

  const handleOpenDeleteModal = (label: LabelStock) => {
    setLabelToDelete(label);
    setDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setLabelToDelete(null);
    setDeleteModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (labelToDelete) {
      const result = onDeleteLabel(labelToDelete.id);
      setStatusMessage({ type: result.success ? 'success' : 'error', message: result.message });
      handleCloseDeleteModal();
      
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  return (
    <div className="space-y-8">
      <LabelExcelImporter onConfirm={onBatchAddLabels} />
      <Card>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Listado de Etiquetas</h2>
        
        <div className="flex flex-col sm:flex-row gap-4 my-4">
          <input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full sm:w-1/2 rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:border-[#03BDC0] focus:ring-[#03BDC0] sm:text-sm"
          />
          <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as Category | 'all')}
              className="block w-full sm:w-1/2 rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:border-[#03BDC0] focus:ring-[#03BDC0] sm:text-sm capitalize"
          >
              <option value="all">Todas las categorías</option>
              {sortedCategories.map(cat => <option key={cat} value={cat} className="capitalize">{cat}</option>)}
          </select>
        </div>

        {statusMessage && (
          <div className={`p-3 my-4 rounded-md text-sm ${statusMessage.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'}`}>
              {statusMessage.message}
          </div>
        )}

        <div className="overflow-x-auto">
            {filteredInventory.length > 0 ? (
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Nombre</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Categoría</th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Acciones</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {filteredInventory.map(label => (
                            <tr key={label.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">{label.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 capitalize">{label.category}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex gap-2 justify-end">
                                        <Button onClick={() => handleOpenEditModal(label)} variant="secondary" className="px-3 py-1.5">
                                            <PencilIcon className="h-4 w-4 mr-1" />
                                            Editar
                                        </Button>
                                        <Button onClick={() => handleOpenDeleteModal(label)} variant="danger" className="px-3 py-1.5">
                                            <TrashIcon className="h-4 w-4 mr-1" />
                                            Eliminar
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <div className="text-center py-10">
                    <TagIcon className="mx-auto h-12 w-12 text-slate-400" />
                    <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">No se encontraron etiquetas</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Intenta ajustar tu búsqueda o filtros, o agrega una nueva etiqueta.</p>
                </div>
            )}
        </div>
      </Card>
      
      {isEditModalOpen && selectedLabel && (
        <EditLabelModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onConfirm={handleConfirmEdit}
          label={selectedLabel}
        />
      )}

      {isDeleteModalOpen && labelToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md transform transition-all">
                <div className="flex justify-between items-center p-4 border-b dark:border-slate-700">
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">Confirmar Eliminación</h3>
                    <button onClick={handleCloseDeleteModal} className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        ¿Estás seguro de que deseas eliminar la etiqueta "<strong>{labelToDelete.name}</strong>"? Esta acción no se puede deshacer.
                    </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 sm:px-6 flex flex-row-reverse gap-3">
                    <Button onClick={handleConfirmDelete} variant="danger">
                        Sí, eliminar
                    </Button>
                    <Button onClick={handleCloseDeleteModal} variant="secondary">
                        Cancelar
                    </Button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default LabelManager;