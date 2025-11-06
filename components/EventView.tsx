import React, { useState, useMemo, useEffect } from 'react';
import { LabelStock, Event, EventRequirement, Category, CATEGORIES } from '../types';
import Card from './Card';
import Button from './Button';
import { TicketIcon, PlusIcon, ArrowLeftIcon, DocumentArrowDownIcon, PencilIcon, CheckCircleIcon, XMarkIcon } from './icons';

type RequirementData = Record<string, { requiredQuantity: number; requiredSampleQuantity: number }>;

// Make TypeScript aware of the XLSX global variable from the CDN script
declare const XLSX: any;

// --- Confirmation Modal ---
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md transform transition-all">
                <div className="flex justify-between items-center p-4 border-b dark:border-slate-700">
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6">
                    <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 sm:px-6 flex flex-row-reverse gap-3">
                    <Button onClick={onConfirm} variant="danger">Confirmar</Button>
                    <Button onClick={onClose} variant="secondary">Cancelar</Button>
                </div>
            </div>
        </div>
    );
};


// --- Event Detail View ---
interface EventDetailViewProps {
  event: Event;
  inventory: LabelStock[];
  onBack: () => void;
  onEdit: (event: Event) => void;
  onComplete: (eventId: string) => { success: boolean, message: string };
}

const EventDetailView: React.FC<EventDetailViewProps> = ({ event, inventory, onBack, onEdit, onComplete }) => {
  const [completionStatus, setCompletionStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  
  const inventoryMap = useMemo(() => new Map(inventory.map(item => [item.id, item])), [inventory]);

  const processedRequirements = useMemo(() => {
    return event.requirements.map(req => {
      const stockItem = inventoryMap.get(req.labelId);
      const currentQuantity = stockItem?.quantity || 0;
      const currentSampleQuantity = stockItem?.sampleQuantity || 0;
      const unitDeficit = Math.max(0, req.requiredQuantity - currentQuantity);
      const sampleDeficit = Math.max(0, req.requiredSampleQuantity - currentSampleQuantity);
      
      return {
        ...req,
        labelName: stockItem?.name || 'Etiqueta Desconocida',
        labelCategory: stockItem?.category,
        currentQuantity,
        currentSampleQuantity,
        unitDeficit,
        sampleDeficit,
      };
    }).sort((a, b) => a.labelName.localeCompare(b.labelName));
  }, [event.requirements, inventoryMap]);

  const handleDownloadExcel = () => {
    const workbook = XLSX.utils.book_new();

    const groupedByCategory = processedRequirements.reduce((acc, item) => {
        const category = item.labelCategory || 'Sin Categoría';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(item);
        return acc;
    }, {} as Record<string, typeof processedRequirements>);

    Object.entries(groupedByCategory).forEach(([category, items]) => {
        const categoryName = category.toUpperCase();
        const headers = ["STOCK", "CANT", categoryName, "M", "UND"];
        
        const data = items.map(item => {
            const row: (string | number)[] = [
                "", // STOCK (empty)
                item.requiredQuantity,
                item.labelName.toUpperCase(),
            ];
            if (item.requiredSampleQuantity > 0) {
                row.push("MUESTRA");
                row.push(item.requiredSampleQuantity);
            }
            return row;
        });
        
        const worksheetData = [headers, ...data];
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        
        // Adjust column widths
        worksheet["!cols"] = [
            { wch: 8 }, 
            { wch: 8 },
            { wch: 50 },
            { wch: 10 },
            { wch: 8 },
        ];

        XLSX.utils.book_append_sheet(workbook, worksheet, categoryName.substring(0, 31)); // Sheet names have a 31-char limit
    });
    
    XLSX.writeFile(workbook, `${event.title.replace(/\s+/g, '_')}_requerimientos.xlsx`);
  };

  const handleComplete = () => {
    const result = onComplete(event.id);
    if (result.success) {
      setCompletionStatus({ type: 'success', message: result.message });
    } else {
      setCompletionStatus({ type: 'error', message: result.message });
    }
    setConfirmModalOpen(false);
  };

  return (
    <>
    <Card>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
        <div>
            <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{event.title}</h2>
                {event.status === 'completed' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200">
                        <CheckCircleIcon className="h-4 w-4 mr-1.5"/>
                        REALIZADO
                    </span>
                )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Análisis de Faltantes</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
             <Button onClick={handleDownloadExcel} variant="secondary">
                <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                Descargar Excel
            </Button>
            {event.status === 'planning' && (
                <>
                    <Button onClick={() => onEdit(event)} variant="secondary">
                        <PencilIcon className="h-5 w-5 mr-2" />
                        Editar
                    </Button>
                    <Button onClick={() => setConfirmModalOpen(true)} variant="success">
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        REALIZADO
                    </Button>
                </>
            )}
            <Button onClick={onBack} variant="secondary">
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Volver
            </Button>
        </div>
      </div>
       {completionStatus && (
            <div className={`p-4 mb-4 rounded-md text-sm ${completionStatus.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'}`}>
                {completionStatus.message}
            </div>
        )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Etiqueta</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Necesarias (Uds)</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Faltante (Uds)</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Necesarias (Muestras)</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Faltante (Muestras)</th>
                </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {processedRequirements.map((item) => (
                <tr key={item.labelId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <p className="font-medium text-slate-900 dark:text-white">{item.labelName}</p>
                        <p className="text-slate-500 dark:text-slate-400 capitalize">{item.labelCategory}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500 dark:text-slate-400">{item.requiredQuantity.toLocaleString()}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-bold ${item.unitDeficit > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {item.unitDeficit.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500 dark:text-slate-400">{item.requiredSampleQuantity.toLocaleString()}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-bold ${item.sampleDeficit > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {item.sampleDeficit.toLocaleString()}
                    </td>
                </tr>
                ))}
            </tbody>
        </table>
      </div>
    </Card>
    <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleComplete}
        title="Confirmar Finalización de Evento"
        message="Esto dará salida al stock requerido del inventario y marcará el evento como completado. Esta acción no se puede deshacer. ¿Deseas continuar?"
    />
    </>
  );
};


// --- Event Creator / Editor View ---
interface EventCreatorViewProps {
  inventory: LabelStock[];
  onSave: (eventData: Omit<Event, 'id' | 'status'>) => void;
  onCancel: () => void;
  eventToEdit?: Event | null;
}

const EventCreatorView: React.FC<EventCreatorViewProps> = ({ inventory, onSave, onCancel, eventToEdit }) => {
    const [title, setTitle] = useState('');
    const [requirements, setRequirements] = useState<RequirementData>({});
    const [error, setError] = useState('');
    
    const groupedAndSortedInventory = useMemo(() => {
        const grouped = inventory.reduce((acc, item) => {
            const key = item.category;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(item);
            return acc;
        }, {} as Record<Category, LabelStock[]>);

        return Object.entries(grouped)
            .map(([category, labels]) => ({
                category: category as Category,
                labels: labels.sort((a, b) => a.name.localeCompare(b.name, 'es')),
            }))
            .sort((a, b) => a.category.localeCompare(b.category, 'es'));
    }, [inventory]);

    const [selectedCategory, setSelectedCategory] = useState<Category | null>(
      groupedAndSortedInventory.length > 0 ? groupedAndSortedInventory[0].category : null
    );

    useEffect(() => {
      let initialReqs: RequirementData = {};

      if (eventToEdit) {
        setTitle(eventToEdit.title);
        initialReqs = eventToEdit.requirements.reduce((acc, req) => {
            acc[req.labelId] = {
                requiredQuantity: req.requiredQuantity,
                requiredSampleQuantity: req.requiredSampleQuantity
            };
            return acc;
        }, {} as RequirementData);
      } else {
        setTitle('');
      }

      inventory.forEach(item => {
        if (!initialReqs[item.id]) {
            initialReqs[item.id] = { requiredQuantity: 0, requiredSampleQuantity: 0 };
        }
      });
      
      setRequirements(initialReqs);

      if (!selectedCategory && groupedAndSortedInventory.length > 0) {
        setSelectedCategory(groupedAndSortedInventory[0].category);
      }
    }, [eventToEdit, inventory, groupedAndSortedInventory, selectedCategory]);


    const handleRequirementChange = (labelId: string, field: 'requiredQuantity' | 'requiredSampleQuantity', value: string) => {
        const numValue = Number(value) || 0;
        setRequirements(prev => ({
            ...prev,
            [labelId]: { ...prev[labelId], [field]: numValue >= 0 ? numValue : 0 }
        }));
    };

    const handleSave = () => {
        if (!title.trim()) {
            setError('El título del evento es obligatorio.');
            return;
        }
        
        const finalRequirements: EventRequirement[] = Object.entries(requirements)
            .map(([labelId, { requiredQuantity, requiredSampleQuantity }]) => ({
                labelId,
                requiredQuantity,
                requiredSampleQuantity
            }))
            .filter(req => req.requiredQuantity > 0 || req.requiredSampleQuantity > 0);

        onSave({ title: title.trim(), requirements: finalRequirements });
    };

    const viewTitle = eventToEdit ? 'Editar Evento' : 'Crear Nuevo Evento';
    const saveButtonText = eventToEdit ? 'Guardar Cambios' : 'Guardar Evento';
    
    const visibleLabels = groupedAndSortedInventory.find(g => g.category === selectedCategory)?.labels || [];

    return (
        <Card>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4 border-b dark:border-slate-700 pb-4">
                 <h2 className="text-xl font-bold text-slate-900 dark:text-white">{viewTitle}</h2>
                 <div className="flex-shrink-0 flex items-center justify-end gap-3">
                    <Button onClick={onCancel} variant="secondary">Cancelar</Button>
                    <Button onClick={handleSave} variant="primary">{saveButtonText}</Button>
                </div>
            </div>
            <div className="space-y-6">
                 <div>
                    <label htmlFor="event-title" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Título del Evento</label>
                    <input
                        type="text"
                        id="event-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:border-[#03BDC0] focus:ring-[#03BDC0] sm:text-sm"
                        placeholder="Ej: Feria Anual de Artesanías"
                        autoFocus
                    />
                </div>
                 <div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Requerimientos de Etiquetas</h3>
                    <div className="flex flex-col md:flex-row gap-6">
                        <aside className="md:w-1/4">
                            <nav>
                                <ul className="space-y-1">
                                    {groupedAndSortedInventory.map(({ category }) => (
                                        <li key={category}>
                                            <button
                                                onClick={() => setSelectedCategory(category)}
                                                className={`w-full text-left p-2 rounded-md text-sm font-medium transition-colors duration-150 capitalize ${
                                                    selectedCategory === category
                                                    ? 'bg-[#E6F5F5] dark:bg-[#014F51]/50 text-[#028588] dark:text-[#9AE0E2]'
                                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                                }`}
                                            >
                                                {category}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        </aside>
                        <main className="flex-1">
                            <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-2">
                                {visibleLabels.length > 0 ? visibleLabels.map(item => (
                                    <div key={item.id} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                        <div className="sm:col-span-1">
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.name}</p>
                                        </div>
                                        <div className="sm:col-span-1">
                                            <label htmlFor={`req-units-${item.id}`} className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Unidades Requeridas</label>
                                            <input
                                                type="number"
                                                id={`req-units-${item.id}`}
                                                value={requirements[item.id]?.requiredQuantity ?? ''}
                                                onChange={(e) => handleRequirementChange(item.id, 'requiredQuantity', e.target.value)}
                                                className="block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:border-[#03BDC0] focus:ring-[#03BDC0] sm:text-sm"
                                                placeholder="0"
                                                min="0"
                                            />
                                        </div>
                                        <div className="sm:col-span-1">
                                            <label htmlFor={`req-samples-${item.id}`} className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Muestras Requeridas</label>
                                            <input
                                                type="number"
                                                id={`req-samples-${item.id}`}
                                                value={requirements[item.id]?.requiredSampleQuantity ?? ''}
                                                onChange={(e) => handleRequirementChange(item.id, 'requiredSampleQuantity', e.target.value)}
                                                className="block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:border-[#03BDC0] focus:ring-[#03BDC0] sm:text-sm"
                                                placeholder="0"
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                                        <p>Selecciona una categoría para ver las etiquetas.</p>
                                    </div>
                                )}
                            </div>
                        </main>
                    </div>
                </div>
                {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            </div>
        </Card>
    );
};


// --- Event List View ---
interface EventListViewProps {
  events: Event[];
  onSelectEvent: (event: Event) => void;
  onCreateEvent: () => void;
}

const EventListView: React.FC<EventListViewProps> = ({ events, onSelectEvent, onCreateEvent }) => {
    return (
        <Card>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Eventos Planificados</h2>
                <Button onClick={onCreateEvent} variant="primary" className="mt-4 sm:mt-0">
                    <PlusIcon className="h-5 w-5 mr-2"/>
                    Crear Nuevo Evento
                </Button>
            </div>
            {events.length > 0 ? (
                <ul className="space-y-3">
                    {events.map(event => (
                        <li key={event.id}>
                           <button 
                                onClick={() => onSelectEvent(event)}
                                className="w-full text-left p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200 flex justify-between items-center"
                            >
                                <div>
                                    <p className="font-semibold text-[#028588] dark:text-[#9AE0E2]">{event.title}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                        {event.requirements.length} tipo(s) de etiqueta(s) requerida(s).
                                    </p>
                                </div>
                                {event.status === 'completed' && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200">
                                        REALIZADO
                                    </span>
                                )}
                           </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center py-12">
                    <TicketIcon className="mx-auto h-12 w-12 text-slate-400" />
                    <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">No hay eventos planificados</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Comienza creando un nuevo evento para planificar tu stock.</p>
                </div>
            )}
        </Card>
    );
};


// --- Main Event Manager ---
interface EventManagerProps {
  inventory: LabelStock[];
  events: Event[];
  onCreateEvent: (eventData: Omit<Event, 'id' | 'status'>) => void;
  onEditEvent: (eventId: string, eventData: Omit<Event, 'id' | 'status'>) => void;
  onCompleteEvent: (eventId: string) => { success: boolean, message: string };
}

type EventViewMode = 'list' | 'detail' | 'create' | 'edit';

const EventManager: React.FC<EventManagerProps> = ({ inventory, events, onCreateEvent, onEditEvent, onCompleteEvent }) => {
    const [view, setView] = useState<EventViewMode>('list');
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

    const handleSelectEvent = (event: Event) => {
        setSelectedEvent(event);
        setView('detail');
    };
    
    const handleCreateNew = () => {
        setSelectedEvent(null);
        setView('create');
    };

    const handleEdit = (event: Event) => {
        setSelectedEvent(event);
        setView('edit');
    };

    const handleBackToList = () => {
        setSelectedEvent(null);
        setView('list');
    };

    const handleSave = (eventData: Omit<Event, 'id' | 'status'>) => {
        if(view === 'edit' && selectedEvent) {
            onEditEvent(selectedEvent.id, eventData);
        } else {
            onCreateEvent(eventData);
        }
        setView('list');
    };

    if (view === 'detail' && selectedEvent) {
        return <EventDetailView event={selectedEvent} inventory={inventory} onBack={handleBackToList} onEdit={handleEdit} onComplete={onCompleteEvent} />
    }

    if (view === 'create' || view === 'edit') {
        return <EventCreatorView inventory={inventory} onSave={handleSave} onCancel={handleBackToList} eventToEdit={selectedEvent} />
    }



    return <EventListView events={events} onSelectEvent={handleSelectEvent} onCreateEvent={handleCreateNew} />
};

export default EventManager;