import React from 'react';
import { 
  Smartphone, 
  Gamepad2, 
  Search, 
  SlidersHorizontal, 
  X, 
  Layers 
} from 'lucide-react';
import type { DeviceType, OSStatus } from '../types';

interface CategoryFilterProps {
  selectedType: DeviceType | 'all';
  onSelectType: (type: DeviceType | 'all') => void;
  selectedStatus: OSStatus | 'all';
  onSelectStatus: (status: OSStatus | 'all') => void;
  selectedTechnician: string;
  onSelectTechnician: (tech: string) => void;
  technicians: string[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  counts: {
    all: number;
    celular: number;
    videogame: number;
  };
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedType,
  onSelectType,
  selectedStatus,
  onSelectStatus,
  selectedTechnician,
  onSelectTechnician,
  technicians,
  searchQuery,
  onSearchChange,
  counts,
}) => {
  return (
    <div className="space-y-3 mb-6">
      
      {/* Top Bar: Device Type Segmented Control */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        
        {/* Device Types Pills */}
        <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-sm overflow-x-auto no-scrollbar">
          <button
            onClick={() => onSelectType('all')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              selectedType === 'all'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Todos</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[11px] ${
              selectedType === 'all' ? 'bg-blue-800/80 text-blue-100' : 'bg-slate-800 text-slate-400'
            }`}>
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => onSelectType('celular')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              selectedType === 'celular'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <span>Celulares</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[11px] ${
              selectedType === 'celular' ? 'bg-cyan-800/80 text-cyan-100' : 'bg-slate-800 text-slate-400'
            }`}>
              {counts.celular}
            </span>
          </button>

          <button
            onClick={() => onSelectType('videogame')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              selectedType === 'videogame'
                ? 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Gamepad2 className="w-4 h-4 text-fuchsia-400" />
            <span>Videogames</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[11px] ${
              selectedType === 'videogame' ? 'bg-fuchsia-800/80 text-fuchsia-100' : 'bg-slate-800 text-slate-400'
            }`}>
              {counts.videogame}
            </span>
          </button>
        </div>

        {/* Technician Filter Pill */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-slate-400 hidden md:inline">Técnico:</span>
          <select
            value={selectedTechnician}
            onChange={(e) => onSelectTechnician(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">Todos os Técnicos</option>
            {technicians.map((tech) => (
              <option key={tech} value={tech}>
                {tech}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Search Input & Status Filters Row */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        
        {/* Search Bar */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Buscar por cliente, modelo (ex: iPhone, PS5), OS # ou tel..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-9 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => onSelectStatus(e.target.value as any)}
              className="w-full sm:w-auto bg-slate-900/90 border border-slate-800 text-slate-200 text-xs sm:text-sm rounded-xl pl-9 pr-8 py-2.5 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">Todos os Status</option>
              <option value="aguardando_orcamento">⏳ Aguardando Orçamento</option>
              <option value="aprovado">👍 Aprovado</option>
              <option value="em_bancada">🛠️ Na Bancada / Reparo</option>
              <option value="aguardando_peca">📦 Aguardando Peça</option>
              <option value="pronto">✅ Pronto p/ Retirada</option>
            </select>
          </div>
        </div>

      </div>

    </div>
  );
};
