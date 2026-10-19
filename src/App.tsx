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
import { 
  fetchSharedSettings, 
  saveSharedSettings, 
  subscribeToSharedSettings 
} from './lib/shopSettings';
import { Navbar } from './components/Navbar';
import { FinancialMetrics } from './components/FinancialMetrics';
import { CategoryFilter } from './components/CategoryFilter';
import { OrderCard } from './components/OrderCard';
import { OrderModal } from './components/OrderModal';
import { OrderDetailsModal } from './components/OrderDetailsModal';
import { SettingsModal } from './components/SettingsModal';
import { PinModal } from './components/PinModal';
import { ViewTabs, type AppView } from './components/ViewTabs';
import { HistoryPage } from './components/HistoryPage';
import { PartsPage } from './components/PartsPage';
import { LoginScreen } from './components/LoginScreen';
import { MfaChallengeScreen } from './components/MfaChallengeScreen';
import { SecurityModal } from './components/SecurityModal';
import { useAuthSession, useIdleSignOut } from './lib/auth';
import { Plus, Inbox, RefreshCw, CheckCircle2, AlertTriangle, X } from 'lucide-react';

// Ordens encerradas (finalizadas ou canceladas) saem desta aba: finalizadas ficam no Histórico
// e canceladas ficam em Histórico > Canceladas
const isClosed = (o: Order) => o.status === 'entregue' || o.status === 'cancelado';

interface ToastMessage {
  id: number;
  type: 'success' | 'warning' | 'error';
  message: string;
}

interface AppContentProps {
  onSignOut?: () => void;
  userEmail?: string;
}

const AppContent: React.FC<AppContentProps> = ({ onSignOut, userEmail }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<ShopSettings>(getSettings());
  const [isCloud, setIsCloud] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [view, setView] = useState<AppView>('orders');
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);

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

  // Helper toast notification
  const showToast = useCallback((message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

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

  // Carrega nome da loja e técnicos compartilhados (Supabase)
  const loadSharedSettings = useCallback(async () => {
    const shared = await fetchSharedSettings();
    if (!shared) return;
    setSettings((prev) => {
      const technicians = shared.technicians.length > 0 ? shared.technicians : prev.technicians;
      const active_technician = technicians.includes(prev.active_technician)
        ? prev.active_technician
        : technicians[0];
      return { ...prev, shop_name: shared.shop_name, technicians, active_technician };
    });
  }, []);

  useEffect(() => {
    loadData();
    loadSharedSettings();

    // Sincronização em tempo real quando Supabase estiver ativo
    const unsubscribe = subscribeToRealtimeOrders(() => {
      loadData(true);
    });

    const unsubscribeSettings = subscribeToSharedSettings(() => {
      loadSharedSettings();
    });

    // Sincroniza sempre que a janela ou o celular ganha foco (ao trocar de aba/desbloquear tela)
    const handleFocus = () => {
      loadData(true);
      loadSharedSettings();
    };
    window.addEventListener('focus', handleFocus);

    // Polling suave a cada 12 segundos para manter PC e Celular na mesma rede sincronizados
    const interval = setInterval(() => {
      loadData(true);
      loadSharedSettings();
    }, 12000);

    return () => {
      unsubscribe();
      unsubscribeSettings();
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [loadData, loadSharedSettings]);

  // Handle Quick Status Change
  const handleUpdateStatus = async (id: string, newStatus: OSStatus) => {
    try {
      const { order: updated, cloudError } = await updateOrder(id, { status: newStatus });
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
      if (orderForDetails?.id === id) {
        setOrderForDetails(updated);
      }

      if (cloudError) {
        showToast(`Salvo localmente! Aviso da nuvem: ${cloudError}`, 'warning');
      } else if (newStatus === 'entregue') {
        showToast(`OS #${updated.os_number} finalizada e movida para o Histórico!`, 'success');
      } else if (newStatus === 'cancelado') {
        showToast(`OS #${updated.os_number} cancelada. Ela fica em Histórico > Canceladas.`, 'warning');
      } else {
        showToast(`Status da OS #${updated.os_number} atualizado com sucesso!`, 'success');
      }
    } catch (err: any) {
      showToast(`Erro ao atualizar status: ${err.message}`, 'error');
    }
  };

  // Handle Save (Create or Edit)
  const handleSaveOrder = async (orderData: any) => {
    try {
      if (orderToEdit) {
        const { order: updated, cloudError } = await updateOrder(orderToEdit.id, orderData);
        setOrders((prev) => prev.map((o) => (o.id === orderToEdit.id ? updated : o)));
        if (orderForDetails?.id === orderToEdit.id) {
          setOrderForDetails(updated);
        }
        setOrderToEdit(null);

        if (cloudError) {
          showToast(`Alterações da OS #${updated.os_number} salvas no disco/local! (Aviso da nuvem: ${cloudError})`, 'warning');
        } else {
          showToast(`Alterações da OS #${updated.os_number} salvas com sucesso!`, 'success');
        }
      } else {
        const { order: created, cloudError } = await createOrder(orderData);
        setOrders((prev) => [created, ...prev]);

        if (cloudError) {
          showToast(`OS #${created.os_number} criada e salva no disco/local! (Aviso da nuvem: ${cloudError})`, 'warning');
        } else {
          showToast(`Ordem de Serviço #${created.os_number} cadastrada com sucesso!`, 'success');
        }
      }
    } catch (err: any) {
      showToast(`Erro ao salvar ordem: ${err?.message || 'Falha desconhecida'}`, 'error');
    }
  };

  // Handle Live Auto-Save (from workbench details)
  const handleAutoSave = async (id: string, updates: Partial<Order>): Promise<Order> => {
    const { order: updated, cloudError } = await updateOrder(id, updates);
    setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
    if (orderForDetails?.id === id) {
      setOrderForDetails(updated);
    }
    if (cloudError) {
      console.warn('Erro ao sincronizar na nuvem (salvo localmente):', cloudError);
    }
    return updated;
  };

  // Handle Delete
  const handleDeleteOrder = async (id: string) => {
    try {
      await deleteOrder(id);
      setOrders((prev) => prev.filter((o) => o.id !== id));
      if (orderForDetails?.id === id) {
        setOrderForDetails(null);
      }
      showToast('Ordem de Serviço excluída com sucesso!', 'success');
    } catch (err: any) {
      showToast(`Erro ao excluir ordem: ${err.message}`, 'error');
    }
  };

  // Handle Settings Update
  const handleSaveSettings = async (newSettings: ShopSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    if (!newSettings.pin_required) {
      setIsLocked(false);
    }
    const { error } = await saveSharedSettings({
      shop_name: newSettings.shop_name,
      technicians: newSettings.technicians,
    });
    if (error) {
      showToast(`Salvo só neste aparelho. Erro na nuvem: ${error}`, 'warning');
    } else {
      showToast('Configurações salvas e aplicadas em todos os aparelhos!', 'success');
    }
  };

  const handleSelectTechnician = (tech: string) => {
    const updated = { ...settings, active_technician: tech };
    setSettings(updated);
    saveSettings(updated);
  };

  // Filtered orders & counts
  const counts = useMemo(() => {
    const open = orders.filter((o) => !isClosed(o));
    return {
      all: open.length,
      celular: open.filter((o) => o.device_type === 'celular').length,
      videogame: open.filter((o) => o.device_type === 'videogame').length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Encerradas não aparecem na aba Ordens
      if (isClosed(order)) {
        return false;
      }

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

  const renderCard = (order: Order) => (
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
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-2xl shadow-2xl border backdrop-blur-md text-xs font-semibold animate-in slide-in-from-top duration-200 ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
                : toast.type === 'warning'
                ? 'bg-amber-950/90 text-amber-200 border-amber-500/40'
                : 'bg-rose-950/90 text-rose-200 border-rose-500/40'
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-slate-400 hover:text-white ml-2 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

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

      <ViewTabs
        view={view}
        onChange={setView}
        onSignOut={onSignOut}
        onOpenSecurity={onSignOut ? () => setIsSecurityOpen(true) : undefined}
        userEmail={userEmail}
      />

      {view === 'history' && (
        <HistoryPage orders={orders} onViewDetails={(ord) => setOrderForDetails(ord)} />
      )}

      {view === 'parts' && <PartsPage />}

      {/* Main Container */}
      {view === 'orders' && (
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
            onClick={() => {
              loadData(true);
              showToast('Lista de ordens atualizada!', 'success');
            }}
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
            {filteredOrders.map(renderCard)}
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
                : 'Nenhuma ordem em aberto nesta categoria. As finalizadas ficam na aba Histórico.'}
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
      )}

      {/* Floating Action Button for Mobile screens (Sticky Bottom-Right) */}
      {view === 'orders' && (
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
      )}

      {/* MODALS */}
      {isSecurityOpen && onSignOut && <SecurityModal onClose={() => setIsSecurityOpen(false)} />}
      
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

      {/* Order Details & Live Autosave Workbench Sheet */}
      <OrderDetailsModal
        order={orderForDetails}
        shopName={settings.shop_name}
        technicians={settings.technicians}
        isOpen={!!orderForDetails}
        onClose={() => setOrderForDetails(null)}
        onAutoSave={handleAutoSave}
        onDelete={handleDeleteOrder}
      />

      {/* Settings Modal (Supabase & Shop Setup) */}
      {isSettingsOpen && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onSaveSettings={handleSaveSettings}
          onRefreshData={() => loadData(true)}
        />
      )}

    </div>
  );
};

// Só carrega o sistema (e os dados) depois do login quando a nuvem está configurada
export const App: React.FC = () => {
  const { cloudEnabled, session, checking, needsMfa, aalReady, recheckAal, signOut } = useAuthSession();

  // Sai sozinho após 30 minutos sem uso (protege aparelhos esquecidos abertos)
  useIdleSignOut(cloudEnabled && !!session, signOut, 30);

  if (checking || (cloudEnabled && session && !aalReady)) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (cloudEnabled && !session) {
    return <LoginScreen />;
  }

  if (cloudEnabled && needsMfa) {
    return <MfaChallengeScreen onVerified={recheckAal} onSignOut={signOut} />;
  }

  return (
    <AppContent
      onSignOut={cloudEnabled ? signOut : undefined}
      userEmail={session?.user.email}
    />
  );
};

export default App;
