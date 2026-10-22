import React from 'react';
import { ClipboardList, History as HistoryIcon, Package, Smartphone, LogOut, ShieldCheck } from 'lucide-react';

export type AppView = 'orders' | 'history' | 'parts' | 'resale';

interface ViewTabsProps {
  view: AppView;
  onChange: (view: AppView) => void;
  onSignOut?: () => void;
  onOpenSecurity?: () => void;
  userEmail?: string;
}

const TABS: { id: AppView; label: string; icon: React.ReactNode }[] = [
  { id: 'orders', label: 'Ordens', icon: <ClipboardList className="w-4 h-4" /> },
  { id: 'history', label: 'Histórico', icon: <HistoryIcon className="w-4 h-4" /> },
  { id: 'parts', label: 'Peças', icon: <Package className="w-4 h-4" /> },
  { id: 'resale', label: 'Revenda', icon: <Smartphone className="w-4 h-4" /> },
];

const sideBtn =
  'flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 whitespace-nowrap';

export const ViewTabs: React.FC<ViewTabsProps> = ({ view, onChange, onSignOut, onOpenSecurity, userEmail }) => (
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
      <div className="ml-auto flex gap-1">
        {onOpenSecurity && (
          <button onClick={onOpenSecurity} title="Segurança da conta" className={sideBtn}>
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Segurança</span>
          </button>
        )}
        {onSignOut && (
          <button
            onClick={onSignOut}
            title={userEmail ? `Conectado como ${userEmail}` : 'Sair'}
            className={sideBtn}
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        )}
      </div>
    </div>
  </div>
);
