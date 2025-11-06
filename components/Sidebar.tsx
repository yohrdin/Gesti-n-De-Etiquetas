import React from 'react';
import { PackageIcon, ArrowsRightLeftIcon, ClockIcon, TicketIcon, TagIcon } from './icons';
import { View } from '../types';


interface SidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

const navItems = [
  { id: 'labels', label: 'Etiquetas', icon: <TagIcon className="h-5 w-5 sm:h-6 sm:w-6" /> },
  { id: 'stock', label: 'Stock de Etiquetas', icon: <PackageIcon className="h-5 w-5 sm:h-6 sm:w-6" /> },
  { id: 'transactions', label: 'Ingreso y Salida', icon: <ArrowsRightLeftIcon className="h-5 w-5 sm:h-6 sm:w-6" /> },
  { id: 'history', label: 'Movimientos', icon: <ClockIcon className="h-5 w-5 sm:h-6 sm:w-6" /> },
  { id: 'event', label: 'Evento', icon: <TicketIcon className="h-5 w-5 sm:h-6 sm:w-6" /> },
] as const;

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  return (
    <aside className="w-full sm:w-64 bg-white dark:bg-slate-800 p-2 sm:p-4 flex flex-row sm:flex-col justify-around sm:justify-start sm:border-r border-slate-200 dark:border-slate-700">
      <nav className="w-full">
        <ul className="flex flex-row sm:flex-col gap-1 sm:gap-2">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <li key={item.id} className="flex-1 sm:flex-initial">
                <button
                  onClick={() => onNavigate(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex flex-col sm:flex-row items-center p-2 sm:p-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'bg-[#E6F5F5] dark:bg-[#014F51]/50 text-[#028588] dark:text-[#9AE0E2]'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="flex-shrink-0">{item.icon}</div>
                  <span className="mt-1 sm:mt-0 sm:ml-4 text-xs sm:text-sm">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;