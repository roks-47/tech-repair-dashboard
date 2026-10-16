import React from 'react';
import { ClipboardList, History as HistoryIcon, Package, LogOut } from 'lucide-react';

export type AppView = 'orders' | 'history' | 'parts';

interface ViewTabsProps {
  view: AppView;
  onChange: (view: AppView) => void;
  onSignOut?: () => void;
  userEmail?: string;
}

const TABS: { id: AppView; label: string; icon: React.ReactNode }[] = [
  { id: 'orders', label: 'Ordens', icon: <ClipboardList className="w-4 h-4" /> },
  { id: 'history', label: 'Histórico', icon: <HistoryIcon className="w-4 h-4" /> },
  { id: 'parts', label: 'Peças', icon: <Package className="w-4 h-4" /> },
];

export const ViewTabs: React.FC<ViewTabsProps> = ({ view, onChange, onSignOut, userEmail }) => (
  <div className="bg-slate-900/60 border-b border-slate-800">
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex gap-1 py-2 overflow-x-auto">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
            view === tab.id
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
      {onSignOut && (
        <button
          onClick={onSignOut}
          title={userEmail ? `Conectado como ${userEmail}` : 'Sair'}
          className="ml-auto flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 whitespace-nowrap"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair</span>
        </button>
      )}
    </div>
  </div>
);
