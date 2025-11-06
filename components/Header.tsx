import React from 'react';
import Button from './Button';
import { PlusIcon } from './icons';

interface HeaderProps {
  title: string;
  subtitle: string;
  onAddNew: () => void;
  showAddButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, onAddNew, showAddButton = true }) => {
  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-slate-200 dark:border-slate-700">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {subtitle}
        </p>
      </div>
      {showAddButton && (
        <div className="mt-4 sm:mt-0">
          <Button onClick={onAddNew} variant="primary">
            <PlusIcon className="h-5 w-5 mr-2" />
            Agregar Nueva Etiqueta
          </Button>
        </div>
      )}
    </header>
  );
};

export default Header;