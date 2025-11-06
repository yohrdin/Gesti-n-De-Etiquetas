
export const CATEGORIES = [
  'médica',
  'nutricosmética',
  'facial',
  'corporal',
  'capilar',
  'podológico',
  'íntima',
] as const;

export type Category = typeof CATEGORIES[number];

export interface LabelStock {
  id: string;
  name: string;
  category: Category;
  quantity: number; // Regular stock
  sampleQuantity: number; // Sample stock
}

export type TransactionType = 'ingreso' | 'salida';

export interface Transaction {
  id: string;
  labelId: string;
  labelName: string;
  type: TransactionType;
  quantity: number; // Regular quantity for the transaction
  sampleQuantity?: number; // Optional: sample quantity for the transaction (for 'ingreso' and 'salida')
  timestamp: Date;
}

export type ModalType = 'ingreso' | 'salida' | 'new';

export interface ModalState {
  isOpen: boolean;
  type: ModalType | null;
  label?: LabelStock;
}

export interface EventRequirement {
  labelId: string;
  requiredQuantity: number;
  requiredSampleQuantity: number;
}

export interface Event {
  id: string;
  title: string;
  status: 'planning' | 'completed';
  requirements: EventRequirement[];
}

export type View = 'labels' | 'stock' | 'transactions' | 'history' | 'event';
