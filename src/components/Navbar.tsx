import React from 'react';
import { 
  Wrench, 
  Plus, 
  Settings, 
  Cloud, 
  CloudOff, 
  Lock, 
  UserCheck 
} from 'lucide-react';
import type { ShopSettings } from '../types';

interface NavbarProps {
  settings: ShopSettings;
  isCloud: boolean;
  onOpenNewOrder: () => void;
  onOpenSettings: () => void;
  onLockApp: () => void;
  onSelectTechnician: (tech: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  isCloud,
  onOpenNewOrder,
  onOpenSettings,
  onLockApp,
  onSelectTechnician,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Shop Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/10 shrink-0">
              <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-xl font-bold tracking-tight text-white leading-tight">
                  {settings.shop_name}
                </h1>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Gestão de Reparos • Celulares & Videogames
              </p>
            </div>
          </div>

          {/* Action buttons & info */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Cloud Status Pill */}
            <button
              onClick={onOpenSettings}
              title={isCloud ? "Conectado ao Supabase na nuvem 24/7" : "Modo local (Clique para conectar Supabase)"}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isCloud 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20" 
                  : "bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20"
              }`}
            >
              {isCloud ? (
                <>
                  <Cloud className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                  <span className="hidden md:inline">Nuvem 24/7</span>
                  <span className="md:hidden">Nuvem</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden md:inline">Modo Local</span>
                  <span className="md:hidden">Local</span>
                </>
              )}
            </button>

            {/* Quick Technician Switcher */}
            <div className="relative hidden sm:flex items-center bg-slate-800/80 rounded-lg p-1 border border-slate-700/60">
              <UserCheck className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
              <select
                value={settings.active_technician}
                onChange={(e) => onSelectTechnician(e.target.value)}
                className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer pr-1"
              >
                {settings.technicians.map((tech) => (
                  <option key={tech} value={tech} className="bg-slate-900 text-slate-200">
                    {tech}
                  </option>
                ))}
              </select>
            </div>

            {/* Lock button if PIN is set */}
            {settings.pin_required && (
              <button
                onClick={onLockApp}
                title="Bloquear com PIN"
                className="p-2 sm:px-3 sm:py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/70"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}

            {/* Settings button */}
            <button
              onClick={onOpenSettings}
              title="Configurações & Conexão Supabase"
              className="p-2 sm:px-3 sm:py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/70"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* New OS Button */}
            <button
              onClick={onOpenNewOrder}
              className="flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs sm:text-sm shadow-md shadow-indigo-600/25 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nova OS</span>
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};
