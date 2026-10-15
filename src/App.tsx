import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { 
  Order, 
  ShopSettings, 
  DeviceType, 
  OSStatus 
} from './types';
import { 
  fetchOrders, 
  createOrder, 
  updateOrder, 
  deleteOrder, 
  getSettings, 
  saveSettings, 
  subscribeToRealtimeOrders 
} from './lib/storage';
import { Navbar } from './components/Navbar';
import { FinancialMetrics } from './components/FinancialMetrics';
import { CategoryFilter } from './components/CategoryFilter';
import { OrderCard } from './components/OrderCard';
import { OrderModal } from './components/OrderModal';
import { OrderDetailsModal } from './components/OrderDetailsModal';
import { SettingsModal } from './components/SettingsModal';
import { PinModal } from './components/PinModal';
import { Plus, Inbox, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<ShopSettings>(getSettings());
  const [isCloud, setIsCloud] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Security Lock
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const s = getSettings();
    return s.pin_required;
  });

  // Filters
  const [selectedType, setSelectedType] = useState<DeviceType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<OSStatus | 'all'>('all');
  const [selectedTechnician, setSelectedTechnician] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isOrderModalOpen, setIsOrderModalOpen] = useState<boolean>(false);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
  const [orderForDetails, setOrderForDetails] = useState<Order | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Load orders
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const result = await fetchOrders();
      setOrders(result.orders);
      setIsCloud(result.isCloud);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Subscribe to realtime changes (Supabase)
    const unsubscribe = subscribeToRealtimeOrders(() => {
      loadData(true);
    });

    return () => {
      unsubscribe();
    };
  }, [loadData]);

  // Handle Quick Status Change
  const handleUpdateStatus = async (id: string, newStatus: OSStatus) => {
    try {
      const updated = await updateOrder(id, { status: newStatus });
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
      if (orderForDetails?.id === id) {
        setOrderForDetails(updated);
      }
    } catch (err) {
      alert('Erro ao atualizar status');
    }
  };

  // Handle Save (Create or Edit)
  const handleSaveOrder = async (orderData: any) => {
    if (orderToEdit) {
      const updated = await updateOrder(orderToEdit.id, orderData);
      setOrders((prev) => prev.map((o) => (o.id === orderToEdit.id ? updated : o)));
      if (orderForDetails?.id === orderToEdit.id) {
        setOrderForDetails(updated);
      }
      setOrderToEdit(null);
    } else {
      const created = await createOrder(orderData);
      setOrders((prev) => [created, ...prev]);
    }
  };

  // Handle Delete
  const handleDeleteOrder = async (id: string) => {
    try {
      await deleteOrder(id);
      setOrders((prev) => prev.filter((o) => o.id !== id));
      if (orderForDetails?.id === id) {
        setOrderForDetails(null);
      }
    } catch (err) {
      alert('Erro ao excluir ordem');
    }
  };

  // Handle Settings Update
  const handleSaveSettings = (newSettings: ShopSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    if (!newSettings.pin_required) {
      setIsLocked(false);
    }
  };

  const handleSelectTechnician = (tech: string) => {
    const updated = { ...settings, active_technician: tech };
    setSettings(updated);
    saveSettings(updated);
  };

  // Filtered orders & counts
  const counts = useMemo(() => {
    return {
      all: orders.length,
      celular: orders.filter((o) => o.device_type === 'celular').length,
      videogame: orders.filter((o) => o.device_type === 'videogame').length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Type filter
      if (selectedType !== 'all' && order.device_type !== selectedType) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && order.status !== selectedStatus) {
        return false;
      }

      // Technician filter
      if (selectedTechnician !== 'all' && order.technician_name !== selectedTechnician) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesClient = order.client_name.toLowerCase().includes(query);
        const matchesPhone = order.client_phone.includes(query);
        const matchesDevice = `${order.device_brand} ${order.device_model}`.toLowerCase().includes(query);
        const matchesOS = order.os_number.toString().includes(query);
        const matchesDefect = order.defect_reported.toLowerCase().includes(query);

        if (!matchesClient && !matchesPhone && !matchesDevice && !matchesOS && !matchesDefect) {
          return false;
        }
      }

      return true;
    });
  }, [orders, selectedType, selectedStatus, selectedTechnician, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      
      {/* PIN Security Modal if App is locked */}
      {isLocked && (
        <PinModal
          isOpen={isLocked}
          correctPin={settings.pin_code}
          shopName={settings.shop_name}
          onSuccess={() => setIsLocked(false)}
        />
      )}

      {/* Main App Bar */}
      <Navbar
        settings={settings}
        isCloud={isCloud}
        onOpenNewOrder={() => {
          setOrderToEdit(null);
          setIsOrderModalOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLockApp={() => setIsLocked(true)}
        onSelectTechnician={handleSelectTechnician}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 flex-1 w-full">
        
        {/* Financial Metrics Summary */}
        <FinancialMetrics orders={orders} />

        {/* Categories, Search & Filters */}
        <CategoryFilter
          selectedType={selectedType}
          onSelectType={setSelectedType}
          selectedStatus={selectedStatus}
          onSelectStatus={setSelectedStatus}
          selectedTechnician={selectedTechnician}
          onSelectTechnician={setSelectedTechnician}
          technicians={settings.technicians}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          counts={counts}
        />

        {/* Orders Header / Refresh Indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-slate-200">
              {selectedType === 'all' && 'Todas as Ordens de Serviço'}
              {selectedType === 'celular' && '📱 Ordens de Celulares'}
              {selectedType === 'videogame' && '🎮 Ordens de Videogames'}
            </h2>
            <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full font-mono">
              {filteredOrders.length}
            </span>
          </div>

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-800"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        </div>

        {/* Orders Grid or Loading / Empty States */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Carregando ordens de serviço da bancada...</p>
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                shopName={settings.shop_name}
                onUpdateStatus={handleUpdateStatus}
                onViewDetails={(ord) => setOrderForDetails(ord)}
                onEdit={(ord) => {
                  setOrderToEdit(ord);
                  setIsOrderModalOpen(true);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-10 sm:p-14 text-center flex flex-col items-center justify-center max-w-lg mx-auto my-8">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
              <Inbox className="w-7 h-7" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-1">
              Nenhuma ordem de serviço encontrada
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xs mb-6">
              {searchQuery
                ? 'Nenhum resultado corresponde à sua busca. Tente outros termos ou limpe o filtro.'
                : 'Você ainda não possui ordens cadastradas nesta categoria.'}
            </p>
            <button
              onClick={() => {
                setOrderToEdit(null);
                setIsOrderModalOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Nova OS</span>
            </button>
          </div>
        )}

      </main>

      {/* Floating Action Button for Mobile screens (Sticky Bottom-Right) */}
      <div className="fixed bottom-5 right-5 sm:hidden z-20">
        <button
          onClick={() => {
            setOrderToEdit(null);
            setIsOrderModalOpen(true);
          }}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-600/50 active:scale-90 transition-all border-2 border-slate-900"
          title="Nova OS"
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>
      </div>

      {/* MODALS */}
      
      {/* Create / Edit OS Modal */}
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => {
          setIsOrderModalOpen(false);
          setOrderToEdit(null);
        }}
        onSave={handleSaveOrder}
        orderToEdit={orderToEdit}
        technicians={settings.technicians}
        activeTechnician={settings.active_technician}
      />

      {/* Order Details & Print Receipt Modal */}
      <OrderDetailsModal
        order={orderForDetails}
        shopName={settings.shop_name}
        isOpen={!!orderForDetails}
        onClose={() => setOrderForDetails(null)}
        onEdit={(ord) => {
          setOrderForDetails(null);
          setOrderToEdit(ord);
          setIsOrderModalOpen(true);
        }}
        onDelete={handleDeleteOrder}
      />

      {/* Settings Modal (Supabase & Shop Setup) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onRefreshData={() => loadData(true)}
      />

    </div>
  );
};

export default App;
