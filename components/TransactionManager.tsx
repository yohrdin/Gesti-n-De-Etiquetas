import React, { useState } from 'react';
import { LabelStock, TransactionType } from '../types';
import Card from './Card';
import Button from './Button';
import { PlusIcon, MinusIcon, DocumentArrowUpIcon, DocumentArrowDownIcon } from './icons';

// Make TypeScript aware of the XLSX global variable from the CDN script
declare const XLSX: any;

interface BatchTransaction {
    labelId: string;
    regularQuantity: number;
    sampleQuantity: number;
}

interface TransactionManagerProps {
  inventory: LabelStock[];
  onConfirmTransaction: (labelId: string, type: TransactionType, quantity: number, sampleQuantity: number) => void;
  onConfirmBatchTransaction: (transactions: BatchTransaction[]) => { success: boolean, message: string };
}

const ExcelImporter: React.FC<{ onConfirm: (transactions: BatchTransaction[]) => { success: boolean, message: string } }> = ({ onConfirm }) => {
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

                if (json.length === 0) {
                    throw new Error('El archivo Excel está vacío o no tiene datos.');
                }
                
                const requiredHeaders = ['ID de Etiqueta', 'Cantidad (Unidades)', 'Cantidad (Muestras)'];
                const headers = Object.keys(json[0]);
                for (const header of requiredHeaders) {
                    if (!headers.includes(header)) {
                        throw new Error(`Falta la columna requerida en el Excel: "${header}".`);
                    }
                }

                const transactions: BatchTransaction[] = json.map((row, index) => {
                    const labelId = row['ID de Etiqueta'];
                    const regularQuantity = Number(row['Cantidad (Unidades)']) || 0;
                    const sampleQuantity = Number(row['Cantidad (Muestras)']) || 0;

                    if (!labelId) {
                         throw new Error(`Error en la fila ${index + 2}: El 'ID de Etiqueta' no puede estar vacío.`);
                    }

                    return {
                        labelId: String(labelId),
                        regularQuantity: regularQuantity,
                        sampleQuantity: sampleQuantity,
                    };
                });
                
                const result = onConfirm(transactions);

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
        reader.onerror = () => {
            setError('Error al leer el archivo.');
            setIsProcessing(false);
        };
        reader.readAsArrayBuffer(file);
    };

    const handleDownloadFormat = () => {
        const headers = [
            "ID de Etiqueta",
            "Cantidad (Unidades)",
            "Cantidad (Muestras)",
        ];
        
        const worksheet = XLSX.utils.aoa_to_sheet([headers]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Transacciones");

        worksheet["!cols"] = [
            { wch: 20 },
            { wch: 25 },
            { wch: 25 },
        ];
        
        XLSX.writeFile(workbook, "formato_transacciones.xlsx");
    };

    return (
        <Card className="mb-8">
            <div className="flex items-center gap-3">
                <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center bg-[#CCECED] dark:bg-[#014F51]/50">
                    <DocumentArrowUpIcon className="h-6 w-6 text-[#02A1A4] dark:text-[#68D4D6]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Importar Transacciones desde Excel</h3>
            </div>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Sube un archivo .xlsx o .xls con las columnas: <code className="font-mono text-xs bg-slate-100 dark:bg-slate-700 p-1 rounded">ID de Etiqueta</code>, <code className="font-mono text-xs bg-slate-100 dark:bg-slate-700 p-1 rounded">Cantidad (Unidades)</code>, y <code className="font-mono text-xs bg-slate-100 dark:bg-slate-700 p-1 rounded">Cantidad (Muestras)</code>. Usa números positivos para ingresos y negativos para salidas.
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
                 <label className="w-full sm:w-auto cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 focus:ring-[#03BDC0]">
                    <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                    <span>{file ? file.name : 'Seleccionar archivo'}</span>
                    <input type="file" className="sr-only" onChange={handleFileChange} accept=".xlsx, .xls" />
                </label>
                <Button onClick={handleProcessFile} disabled={!file || isProcessing} className="w-full sm:w-auto">
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


const TransactionForm: React.FC<{
    type: TransactionType;
    inventory: LabelStock[];
    onConfirm: (labelId: string, quantity: number, sampleQuantity: number) => void;
}> = ({ type, inventory, onConfirm }) => {
    const [labelId, setLabelId] = useState<string>(inventory[0]?.id || '');
    const [quantity, setQuantity] = useState<string | number>('');
    const [sampleQuantity, setSampleQuantity] = useState<string | number>('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        
        const numQuantity = Number(quantity) || 0;
        const numSampleQuantity = Number(sampleQuantity) || 0;

        if (!labelId) {
            setError('Por favor, selecciona una etiqueta.');
            return;
        }
        
        const selectedLabel = inventory.find(item => item.id === labelId);
        if (!selectedLabel) {
            setError('La etiqueta seleccionada no es válida.');
            return;
        }

        if (numQuantity <= 0 && numSampleQuantity <= 0) {
            setError('Por favor, ingresa una cantidad válida y mayor a cero.');
            return;
        }

        if (numQuantity < 0 || numSampleQuantity < 0) {
            setError('Las cantidades no pueden ser negativas.');
            return;
        }

        if (type === 'salida') {
            if (numQuantity > selectedLabel.quantity) {
                setError(`No puedes retirar más de ${selectedLabel.quantity.toLocaleString()} unidades.`);
                return;
            }
            if (numSampleQuantity > selectedLabel.sampleQuantity) {
                setError(`No puedes retirar más de ${selectedLabel.sampleQuantity.toLocaleString()} muestras.`);
                return;
            }
        }
        
        onConfirm(labelId, numQuantity, numSampleQuantity);
        setQuantity('');
        setSampleQuantity('');

        const parts = [];
        if (numQuantity > 0) parts.push(`${numQuantity.toLocaleString()} unidades`);
        if (numSampleQuantity > 0) parts.push(`${numSampleQuantity.toLocaleString()} muestras`);
        const verb = type === 'ingreso' ? 'registrado' : 'retirado';
        
        setSuccess(`Se han ${verb} ${parts.join(' y ')}.`);

        setTimeout(() => setSuccess(''), 4000);
    };

    const title = type === 'ingreso' ? 'Registrar Ingreso' : 'Registrar Salida';
    const Icon = type === 'ingreso' ? PlusIcon : MinusIcon;
    const buttonVariant = type === 'ingreso' ? 'success' : 'danger';
    const buttonLabel = type === 'ingreso' ? 'Confirmar Ingreso' : 'Confirmar Salida';

    const selectedLabelForSampleCheck = inventory.find(item => item.id === labelId);

    return (
        <Card>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${type === 'ingreso' ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
                        <Icon className={`h-6 w-6 ${type === 'ingreso' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
                </div>
                <div>
                    <label htmlFor={`label-${type}`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">Etiqueta</label>
                    <select
                        id={`label-${type}`}
                        value={labelId}
                        onChange={e => setLabelId(e.target.value)}
                        className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:border-[#03BDC0] focus:ring-[#03BDC0] sm:text-sm"
                        disabled={inventory.length === 0}
                    >
                        {inventory.length > 0 ? (
                            inventory.map(item => <option key={item.id} value={item.id}>{item.name} (Stock: {item.quantity.toLocaleString()} / Muestras: {item.sampleQuantity.toLocaleString()})</option>)
                        ) : (
                            <option>No hay etiquetas disponibles</option>
                        )}
                    </select>
                </div>
                <div>
                    <label htmlFor={`quantity-${type}`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Cantidad (Unidades Normales)
                    </label>
                    <input
                        type="number"
                        id={`quantity-${type}`}
                        value={quantity}
                        onChange={e => setQuantity(e.target.value)}
                        className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:border-[#03BDC0] focus:ring-[#03BDC0] sm:text-sm"
                        placeholder="0"
                        min="0"
                        disabled={inventory.length === 0}
                    />
                </div>
                 {(type === 'ingreso' || (type === 'salida' && selectedLabelForSampleCheck && selectedLabelForSampleCheck.sampleQuantity > 0)) && (
                    <div>
                        <label htmlFor={`sample-quantity-${type}`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Cantidad de Muestras (Opcional)
                        </label>
                        <input
                            type="number"
                            id={`sample-quantity-${type}`}
                            value={sampleQuantity}
                            onChange={e => setSampleQuantity(e.target.value)}
                            className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:border-[#03BDC0] focus:ring-[#03BDC0] sm:text-sm"
                            placeholder="0"
                            min="0"
                            disabled={inventory.length === 0}
                        />
                    </div>
                )}
                <div className="pt-2">
                    <Button type="submit" variant={buttonVariant} className="w-full" disabled={inventory.length === 0}>
                        {buttonLabel}
                    </Button>
                </div>
                <div className="h-5">
                    {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
                    {success && <p className="text-sm text-green-600 dark:text-green-400">{success}</p>}
                </div>
            </form>
        </Card>
    );
};

const TransactionManager: React.FC<TransactionManagerProps> = ({ inventory, onConfirmTransaction, onConfirmBatchTransaction }) => {
    return (
        <div className="space-y-8">
            <ExcelImporter onConfirm={onConfirmBatchTransaction} />
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                <TransactionForm type="ingreso" inventory={inventory} onConfirm={(labelId, quantity, sampleQuantity) => onConfirmTransaction(labelId, 'ingreso', quantity, sampleQuantity)} />
                <TransactionForm type="salida" inventory={inventory} onConfirm={(labelId, quantity, sampleQuantity) => onConfirmTransaction(labelId, 'salida', quantity, sampleQuantity)} />
            </div>
        </div>
    );
};

export default TransactionManager;