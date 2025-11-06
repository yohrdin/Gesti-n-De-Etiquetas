import React, { useState, useCallback, useMemo } from 'react';
import { LabelStock, Transaction, ModalState, ModalType, TransactionType, Event, Category, View } from './types';
import InventoryList from './components/InventoryList';
import HistoryLog from './components/HistoryLog';
import Header from './components/Header';
import StockModal from './components/StockModal';
import NewLabelModal from './components/NewLabelModal';
import Sidebar from './components/Sidebar';
import TransactionManager from './components/TransactionManager';
import EventManager from './components/EventView';
import LabelManager from './components/LabelManager';

// Sample initial data for demonstration purposes
const initialInventory: LabelStock[] = [
  { id: 'etq-001', name: 'Etiqueta Adhesiva 5x5cm', category: 'corporal', quantity: 1500, sampleQuantity: 50 },
  { id: 'etq-002', name: 'Etiqueta Térmica 10x8cm', category: 'médica', quantity: 8, sampleQuantity: 100 },
  { id: 'etq-003', name: 'Etiqueta de Cartón Colgante', category: 'facial', quantity: 2300, sampleQuantity: 120 },
  { id: 'etq-004', name: 'Etiqueta de Seguridad Void', category: 'íntima', quantity: 500, sampleQuantity: 20 },
];

const initialHistory: Transaction[] = [
    { id: 'txn-001', labelId: 'etq-001', labelName: 'Etiqueta Adhesiva 5x5cm', type: 'ingreso', quantity: 1500, sampleQuantity: 50, timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    { id: 'txn-002', labelId: 'etq-002', labelName: 'Etiqueta Térmica 10x8cm', type: 'ingreso', quantity: 1000, sampleQuantity: 100, timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    { id: 'txn-003', labelId: 'etq-003', labelName: 'Etiqueta de Cartón Colgante', type: 'ingreso', quantity: 2500, sampleQuantity: 120, timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    { id: 'txn-004', labelId: 'etq-002', labelName: 'Etiqueta Térmica 10x8cm', type: 'salida', quantity: 992, timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
    { id: 'txn-005', labelId: 'etq-003', labelName: 'Etiqueta de Cartón Colgante', type: 'salida', quantity: 200, timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
    { id: 'txn-006', labelId: 'etq-004', labelName: 'Etiqueta de Seguridad Void', type: 'ingreso', quantity: 500, sampleQuantity: 20, timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
];

const initialEvents: Event[] = [
    {
        id: 'evt-001',
        title: 'Lanzamiento Colección Verano 2024',
        status: 'planning',
        requirements: [
            { labelId: 'etq-001', requiredQuantity: 200, requiredSampleQuantity: 10 },
            { labelId: 'etq-002', requiredQuantity: 5, requiredSampleQuantity: 20 },
            { labelId: 'etq-004', requiredQuantity: 450, requiredSampleQuantity: 15 },
        ]
    }
];

interface BatchTransaction {
    labelId: string;
    regularQuantity: number;
    sampleQuantity: number;
}

const App: React.FC = () => {
  const [inventory, setInventory] = useState<LabelStock[]>(initialInventory);
  const [history, setHistory] = useState<Transaction[]>(initialHistory);
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [modalState, setModalState] = useState<ModalState>({ isOpen: false, type: null });
  const [currentView, setCurrentView] = useState<View>('labels');

  const handleOpenModal = useCallback((type: ModalType, label?: LabelStock) => {
    setModalState({ isOpen: true, type, label });
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalState({ isOpen: false, type: null });
  }, []);

  const updateStockAndHistory = useCallback((labelId: string, type: TransactionType, regularQuantity: number, sampleQuantity: number = 0) => {
    let updatedLabelName = '';

    setInventory(prevInventory =>
      prevInventory.map(item => {
        if (item.id === labelId) {
          updatedLabelName = item.name;
          const newQuantity = type === 'ingreso' ? item.quantity + regularQuantity : item.quantity - regularQuantity;
          const newSampleQuantity = type === 'ingreso' ? item.sampleQuantity + sampleQuantity : item.sampleQuantity - sampleQuantity;
          return { ...item, quantity: newQuantity, sampleQuantity: newSampleQuantity };
        }
        return item;
      })
    );
    
    if (updatedLabelName && (regularQuantity > 0 || sampleQuantity > 0)) {
        const newTransaction: Transaction = {
            id: `txn-${Date.now()}`,
            labelId: labelId,
            labelName: updatedLabelName,
            type,
            quantity: regularQuantity,
            sampleQuantity: sampleQuantity > 0 ? sampleQuantity : undefined,
            timestamp: new Date(),
        };
        setHistory(prevHistory => [newTransaction, ...prevHistory]);
    }
  }, []);

  const handleBatchUpdate = useCallback((transactions: BatchTransaction[]): { success: boolean, message: string } => {
    const inventoryMap = new Map(inventory.map(item => [item.id, { ...item }]));
    const newHistoryEntries: Transaction[] = [];

    for (let i = 0; i < transactions.length; i++) {
        const tx = transactions[i];
        const item = inventoryMap.get(tx.labelId);

        if (!item) {
            return { success: false, message: `Error en fila ${i + 2}: La etiqueta con ID '${tx.labelId}' no existe.` };
        }
        
        const newQuantity = item.quantity + tx.regularQuantity;
        const newSampleQuantity = item.sampleQuantity + tx.sampleQuantity;

        if (newQuantity < 0) {
            return { success: false, message: `Error en fila ${i + 2}: Stock insuficiente de unidades para la etiqueta '${item.name}'. Se intentó retirar ${-tx.regularQuantity} pero solo hay ${item.quantity}.` };
        }
        if (newSampleQuantity < 0) {
            return { success: false, message: `Error en fila ${i + 2}: Stock insuficiente de muestras para la etiqueta '${item.name}'. Se intentó retirar ${-tx.sampleQuantity} pero solo hay ${item.sampleQuantity}.` };
        }

        item.quantity = newQuantity;
        item.sampleQuantity = newSampleQuantity;
        inventoryMap.set(item.id, item);

        const regularTx = Math.abs(tx.regularQuantity);
        const sampleTx = Math.abs(tx.sampleQuantity);
        
        if (regularTx > 0 || sampleTx > 0) {
            const type = (tx.regularQuantity >= 0 && tx.sampleQuantity >=0) ? 'ingreso' : 'salida';
             newHistoryEntries.push({
                id: `txn-${Date.now()}-${i}`,
                labelId: item.id,
                labelName: item.name,
                type,
                quantity: regularTx,
                sampleQuantity: sampleTx > 0 ? sampleTx : undefined,
                timestamp: new Date(),
            });
        }
    }

    setInventory(Array.from(inventoryMap.values()));
    setHistory(prevHistory => [...newHistoryEntries.reverse(), ...prevHistory]);

    return { success: true, message: `Se procesaron ${transactions.length} transacciones con éxito.` };

  }, [inventory]);
  
  const handleUpdateStockFromModal = useCallback((labelId: string, type: TransactionType, quantity: number, sampleQuantity: number) => {
    updateStockAndHistory(labelId, type, quantity, sampleQuantity);
    handleCloseModal();
  }, [updateStockAndHistory, handleCloseModal]);


  const handleAddNewLabel = useCallback((name: string, category: Category, initialQuantity: number, initialSampleQuantity: number) => {
    const newLabel: LabelStock = {
      id: `etq-${String(Date.now()).slice(-6)}`,
      name,
      category,
      quantity: initialQuantity,
      sampleQuantity: initialSampleQuantity,
    };
    setInventory(prevInventory => [...prevInventory, newLabel]);

    if (initialQuantity > 0 || initialSampleQuantity > 0) {
      const newTransaction: Transaction = {
        id: `txn-${Date.now()}`,
        labelId: newLabel.id,
        labelName: newLabel.name,
        type: 'ingreso',
        quantity: initialQuantity,
        sampleQuantity: initialSampleQuantity > 0 ? initialSampleQuantity : undefined,
        timestamp: new Date(),
      };
      setHistory(prevHistory => [newTransaction, ...prevHistory]);
    }

    handleCloseModal();
  }, [handleCloseModal]);
  
  const handleCreateEvent = useCallback((newEventData: Omit<Event, 'id' | 'status'>) => {
    const newEvent: Event = {
      ...newEventData,
      id: `evt-${Date.now()}`,
      status: 'planning',
    };
    setEvents(prevEvents => [newEvent, ...prevEvents]);
  }, []);

  const handleEditEvent = useCallback((eventId: string, updatedData: Omit<Event, 'id' | 'status'>) => {
    setEvents(prevEvents => prevEvents.map(e => 
        e.id === eventId ? { ...e, title: updatedData.title, requirements: updatedData.requirements } : e
    ));
  }, []);

  const handleCompleteEvent = useCallback((eventId: string): { success: boolean, message: string } => {
    const event = events.find(e => e.id === eventId);
    if (!event) {
        return { success: false, message: "Evento no encontrado." };
    }
    if (event.status === 'completed') {
        return { success: false, message: "Este evento ya ha sido completado." };
    }

    const transactions: BatchTransaction[] = event.requirements.map(req => ({
        labelId: req.labelId,
        regularQuantity: -req.requiredQuantity,
        sampleQuantity: -req.requiredSampleQuantity
    }));

    const batchResult = handleBatchUpdate(transactions);

    if (batchResult.success) {
        setEvents(prevEvents => prevEvents.map(e => 
            e.id === eventId ? { ...e, status: 'completed' } : e
        ));
        return { success: true, message: "¡Evento completado! El stock ha sido actualizado." };
    } else {
        return { success: false, message: `No se pudo completar el evento. ${batchResult.message}` };
    }
}, [events, handleBatchUpdate]);

  const handleEditLabel = useCallback((labelId: string, newName: string, newCategory: Category) => {
    setInventory(prev => prev.map(item =>
        item.id === labelId ? { ...item, name: newName, category: newCategory } : item
    ));
    setHistory(prev => prev.map(tx =>
        tx.labelId === labelId ? { ...tx, labelName: newName } : tx
    ));
}, []);

  const handleBatchAddLabels = useCallback((newLabels: {name: string, category: Category}[]) => {
    const existingNames = new Set(inventory.map(i => i.name.toLowerCase()));
    const labelsToAdd: LabelStock[] = [];

    for (let i = 0; i < newLabels.length; i++) {
        const label = newLabels[i];
        if (existingNames.has(label.name.toLowerCase())) {
            // Optionally, return an error or just skip duplicates. Skipping is simpler.
            console.warn(`Skipping duplicate label name: ${label.name}`);
            continue;
        }
        labelsToAdd.push({
            id: `etq-${Date.now()}-${i}`,
            name: label.name,
            category: label.category,
            quantity: 0,
            sampleQuantity: 0,
        });
    }

    setInventory(prev => [...prev, ...labelsToAdd]);
    return { success: true, message: `Se agregaron ${labelsToAdd.length} nuevas etiquetas.` };
  }, [inventory]);

  const handleDeleteLabel = useCallback((labelId: string): { success: boolean, message: string } => {
    const label = inventory.find(l => l.id === labelId);
    if (!label) {
        return { success: false, message: "La etiqueta no existe." };
    }
    if (label.quantity > 0 || label.sampleQuantity > 0) {
        return { success: false, message: "No se puede eliminar una etiqueta con stock. Por favor, retira todas las unidades y muestras primero." };
    }
    const isUsedInEvent = events.some(event => 
        event.status === 'planning' && event.requirements.some(req => req.labelId === labelId)
    );
    if (isUsedInEvent) {
        return { success: false, message: "No se puede eliminar una etiqueta que está siendo utilizada en un evento en planificación." };
    }

    setInventory(prev => prev.filter(item => item.id !== labelId));
    
    return { success: true, message: "Etiqueta eliminada con éxito." };
}, [inventory, events]);


  const viewConfig = {
    labels: { title: 'Gestor de Etiquetas', subtitle: 'Define y organiza todas tus etiquetas.' },
    stock: { title: 'Stock de Etiquetas', subtitle: 'Revisa y gestiona tu inventario actual.' },
    transactions: { title: 'Ingreso y Salida', subtitle: 'Registra nuevas entradas y salidas de stock.' },
    history: { title: 'Movimientos', subtitle: 'Consulta el historial de todas las transacciones.' },
    event: { title: 'Gestor de Eventos', subtitle: 'Planifica y consulta los requerimientos para tus eventos.' },
  };

  const renderContent = () => {
    switch (currentView) {
      case 'labels':
        return <LabelManager inventory={inventory} onEditLabel={handleEditLabel} onBatchAddLabels={handleBatchAddLabels} onDeleteLabel={handleDeleteLabel} />;
      case 'stock':
        return <InventoryList inventory={inventory} onOpenModal={handleOpenModal} />;
      case 'transactions':
        return <TransactionManager inventory={inventory} onConfirmTransaction={updateStockAndHistory} onConfirmBatchTransaction={handleBatchUpdate} />;
      case 'history':
        return <HistoryLog history={history} />;
      case 'event':
        return <EventManager inventory={inventory} events={events} onCreateEvent={handleCreateEvent} onEditEvent={handleEditEvent} onCompleteEvent={handleCompleteEvent} />;
      default:
        return <LabelManager inventory={inventory} onEditLabel={handleEditLabel} onBatchAddLabels={handleBatchAddLabels} onDeleteLabel={handleDeleteLabel} />;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row min-h-screen text-slate-800 dark:text-slate-200 font-sans">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />
      <div className="flex-1 flex flex-col">
        <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
            <Header
              title={viewConfig[currentView].title}
              subtitle={viewConfig[currentView].subtitle}
              onAddNew={() => handleOpenModal('new')}
              showAddButton={currentView !== 'event'}
            />
            <main className="mt-8">
              {renderContent()}
            </main>
        </div>
      </div>
      
      {modalState.isOpen && (modalState.type === 'ingreso' || modalState.type === 'salida') && modalState.label && (
        <StockModal
          isOpen={modalState.isOpen}
          onClose={handleCloseModal}
          label={modalState.label}
          type={modalState.type}
          onConfirm={handleUpdateStockFromModal}
        />
      )}
      
      {modalState.isOpen && modalState.type === 'new' && (
        <NewLabelModal
          isOpen={modalState.isOpen}
          onClose={handleCloseModal}
          onConfirm={handleAddNewLabel}
        />
      )}
    </div>
  );
};

export default App;