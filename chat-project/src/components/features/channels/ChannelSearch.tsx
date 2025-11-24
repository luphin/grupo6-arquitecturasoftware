'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Channel, User } from '@/types';
import { FiLock, FiGlobe, FiFilter, FiX } from "react-icons/fi";

interface ChannelSearchProps {
  onChannelSelect: (channelId: string, channelName: string) => void;
  user: User;
  onChannelJoined?: () => void;
}

type AlertType = 'success' | 'error' | 'warning' | 'info' | 'dark' | null;
type ChannelType = 'all' | 'public' | 'private';
type ActiveStatus = 'all' | 'active' | 'inactive';

interface SearchFilters {
  q: string;
  channel_id: string;
  owner_id: string;
  channel_type: ChannelType;
  is_active: ActiveStatus;
}

export function ChannelSearch({ onChannelSelect, user, onChannelJoined }: ChannelSearchProps) {
  // Estados de carga de datos
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Estados de filtros
  const [filters, setFilters] = useState<SearchFilters>({
    q: '',
    channel_id: '',
    owner_id: '',
    channel_type: 'all',
    is_active: 'all',
  });

  // Estados de UI
  const [showFilters, setShowFilters] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [alert, setAlert] = useState<{ type: AlertType; message?: string } | null>(null);

  // Debounce timeout ref
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Construir URL con filtros
  const buildSearchUrl = useCallback((currentOffset: number) => {
    const params = new URLSearchParams();

    if (filters.q.trim()) params.append('q', filters.q.trim());
    if (filters.channel_id.trim()) params.append('channel_id', filters.channel_id.trim());
    if (filters.owner_id.trim()) params.append('owner_id', filters.owner_id.trim());
    if (filters.channel_type !== 'all') params.append('channel_type', filters.channel_type);
    if (filters.is_active !== 'all') params.append('is_active', filters.is_active === 'active' ? 'true' : 'false');

    params.append('limit', '50');
    params.append('offset', currentOffset.toString());

    return `${process.env.NEXT_PUBLIC_API_URL}/api/search/api/channel/search_channel?${params.toString()}`;
  }, [filters]);

  // Cargar canales con filtros
  const loadChannels = useCallback(async (currentOffset: number, append = false) => {
    try {
      setLoading(true);

      const url = buildSearchUrl(currentOffset);
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Error loading channels');
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setChannels(prev => append ? [...prev, ...data] : data);
        setOffset(currentOffset);
        setHasMore(data.length === 50);
      }
    } catch (error) {
      console.error('Error loading channels:', error);
    } finally {
      setLoading(false);
    }
  }, [buildSearchUrl]);

  // Aplicar filtros con debounce
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      setOffset(0);
      loadChannels(0, false);
    }, 500);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [filters, loadChannels]);

  // Scroll Infinito
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const newOffset = offset + 50;
      loadChannels(newOffset, true);
    }
  }, [loading, hasMore, offset, loadChannels]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, loadMore]);

  // Actualizar filtros
  const updateFilter = (key: keyof SearchFilters, value: string | ChannelType | ActiveStatus) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Limpiar filtros
  const clearFilters = () => {
    setFilters({
      q: '',
      channel_id: '',
      owner_id: '',
      channel_type: 'all',
      is_active: 'all',
    });
  };

  // Verificar si hay filtros activos
  const hasActiveFilters = () => {
    return filters.channel_id.trim() !== '' ||
           filters.owner_id.trim() !== '' ||
           filters.channel_type !== 'all' ||
           filters.is_active !== 'all';
  };

  // Contar filtros activos
  const activeFiltersCount = () => {
    let count = 0;
    if (filters.channel_id.trim()) count++;
    if (filters.owner_id.trim()) count++;
    if (filters.channel_type !== 'all') count++;
    if (filters.is_active !== 'all') count++;
    return count;
  };

  // --- Lógica de Unirse al Canal ---
  const handleOpenModal = (channel: Channel) => {
    if (channel.channel_type === 'private') {
      setAlert({
        type: 'warning',
        message: 'Este canal es privado. Solo puedes unirte por invitación.'
      });
      return;
    }

    setAlert(null);
    setSelectedChannel(channel);
  };

  const handleCloseModal = () => {
    setSelectedChannel(null);
  };

  const handleJoinChannel = async () => {
    if (!selectedChannel) return;

    if (!user || !user.id) {
      setAlert({
        type: 'error',
        message: "No se identificó el usuario actual. Verifica que hayas iniciado sesión."
      });
      handleCloseModal();
      return;
    }

    try {
      setIsJoining(true);

      const payload = {
        channel_id: selectedChannel.id,
        user_id: user.id
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/channels/members/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setAlert({ type: 'success' });
        handleCloseModal();

        if (onChannelJoined) {
          onChannelJoined();
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || errorData.message || "Error al conectar con el servidor.";

        let userMessage = errorMessage;
        if (response.status === 401) {
          userMessage = "Tu sesión ha expirado. Por favor, cierra sesión y vuelve a iniciar sesión.";
        } else if (response.status === 403) {
          userMessage = "No tienes permisos para realizar esta acción.";
        }

        setAlert({ type: 'error', message: userMessage });
        handleCloseModal();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      let userMessage = "Ocurrió un error inesperado de red.";

      if (errorMessage.includes('CORS') || errorMessage.includes('NetworkError') || errorMessage.includes('Failed to fetch')) {
        userMessage = "Error de conexión con el servidor.";
      }

      setAlert({ type: 'error', message: userMessage });
      handleCloseModal();
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Search Input */}
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Buscar canales..."
            value={filters.q}
            onChange={(e) => updateFilter('q', e.target.value)}
            className="flex-1 px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative px-3 py-2 rounded-md border transition-colors ${
              showFilters || hasActiveFilters()
                ? 'bg-primary text-white border-primary'
                : 'border-border bg-background text-foreground hover:bg-muted'
            }`}
            title="Filtros avanzados"
          >
            <FiFilter className="w-5 h-5" />
            {activeFiltersCount() > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {activeFiltersCount()}
              </span>
            )}
          </button>
        </div>

        {/* Active Filters Chips */}
        {hasActiveFilters() && (
          <div className="flex flex-wrap gap-2">
            {filters.channel_id && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs">
                ID Canal: {filters.channel_id}
                <button onClick={() => updateFilter('channel_id', '')} className="hover:bg-blue-200 rounded">
                  <FiX className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.owner_id && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs">
                ID Propietario: {filters.owner_id}
                <button onClick={() => updateFilter('owner_id', '')} className="hover:bg-purple-200 rounded">
                  <FiX className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.channel_type !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs">
                {filters.channel_type === 'public' ? 'Público' : 'Privado'}
                <button onClick={() => updateFilter('channel_type', 'all')} className="hover:bg-green-200 rounded">
                  <FiX className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.is_active !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-md text-xs">
                {filters.is_active === 'active' ? 'Activo' : 'Inactivo'}
                <button onClick={() => updateFilter('is_active', 'all')} className="hover:bg-orange-200 rounded">
                  <FiX className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 hover:bg-red-50 rounded-md"
            >
              Limpiar todo
            </button>
          </div>
        )}
      </div>

      {/* Advanced Filters Sidebar */}
      {showFilters && (
        <div className="border-t border-b border-border bg-muted/30 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-foreground">Filtros Avanzados</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>

          {/* Channel ID */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              ID del Canal
            </label>
            <input
              type="text"
              placeholder="Ej: ch_123456"
              value={filters.channel_id}
              onChange={(e) => updateFilter('channel_id', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Owner ID */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              ID del Propietario
            </label>
            <input
              type="text"
              placeholder="Ej: usr_123456"
              value={filters.owner_id}
              onChange={(e) => updateFilter('owner_id', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Channel Type - Chips */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-2">
              Tipo de Canal
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => updateFilter('channel_type', 'all')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  filters.channel_type === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-background border border-border text-foreground hover:bg-muted'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => updateFilter('channel_type', 'public')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  filters.channel_type === 'public'
                    ? 'bg-primary text-white'
                    : 'bg-background border border-border text-foreground hover:bg-muted'
                }`}
              >
                Público
              </button>
              <button
                onClick={() => updateFilter('channel_type', 'private')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  filters.channel_type === 'private'
                    ? 'bg-primary text-white'
                    : 'bg-background border border-border text-foreground hover:bg-muted'
                }`}
              >
                Privado
              </button>
            </div>
          </div>

          {/* Active Status - Chips */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-2">
              Estado
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => updateFilter('is_active', 'all')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  filters.is_active === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-background border border-border text-foreground hover:bg-muted'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => updateFilter('is_active', 'active')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  filters.is_active === 'active'
                    ? 'bg-primary text-white'
                    : 'bg-background border border-border text-foreground hover:bg-muted'
                }`}
              >
                Activos
              </button>
              <button
                onClick={() => updateFilter('is_active', 'inactive')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  filters.is_active === 'inactive'
                    ? 'bg-primary text-white'
                    : 'bg-background border border-border text-foreground hover:bg-muted'
                }`}
              >
                Inactivos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Area de Alertas */}
      {alert && (
        <div className="px-4">
          {alert.type === 'success' && (
            <div className="flex items-start sm:items-center p-4 mb-4 text-sm text-white rounded-base bg-success font-bold" role="alert">
              <svg className="w-4 h-4 me-2 shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 11h2v5m-2 0h4m-2.592-8.5h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
              <p><span className="font-medium me-1">Éxito!</span> Te has unido al canal correctamente.</p>
            </div>
          )}
          {alert.type === 'error' && (
            <div className="flex items-start sm:items-center p-4 mb-4 text-sm text-white rounded-base bg-danger font-bold" role="alert">
              <svg className="w-4 h-4 me-2 shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 11h2v5m-2 0h4m-2.592-8.5h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
              <p>
                <span className="font-medium me-1">Error!</span>
                {alert.message || "No se pudo unir al canal. Inténtalo de nuevo."}
              </p>
            </div>
          )}
          {alert.type === 'warning' && (
            <div className="flex items-start sm:items-center p-4 mb-4 text-sm text-white rounded-base bg-warning font-bold" role="alert">
              <svg className="w-4 h-4 me-2 shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 11h2v5m-2 0h4m-2.592-8.5h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
              <p>
                <span className="font-medium me-1">Advertencia!</span>
                {alert.message}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Channels List */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading && channels.length === 0 ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-foreground">Cargando canales...</p>
          </div>
        ) : channels.length === 0 ? (
          <div className="text-center py-8 text-foreground">
            <p className="text-muted-foreground">No se encontraron canales</p>
            {hasActiveFilters() && (
              <button
                onClick={clearFilters}
                className="mt-2 text-sm text-primary hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {channels.map((channel) => {
              const isPrivate = channel.channel_type === 'private';

              return (
                <button
                  key={channel.id}
                  onClick={() => handleOpenModal(channel)}
                  disabled={isPrivate}
                  title={`Propietario: ${channel.owner_id}`}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    isPrivate
                      ? 'cursor-not-allowed opacity-60'
                      : 'cursor-pointer hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isPrivate ? (
                      <FiLock className="text-lg text-muted-foreground" />
                    ) : (
                      <FiGlobe className="text-lg text-foreground" />
                    )}
                    <span className="font-medium text-foreground">{channel.name}</span>
                    {isPrivate && (
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                        Privado
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Infinite Scroll Trigger */}
        {hasMore && channels.length > 0 && (
          <div ref={observerTarget} className="mt-4 py-4 text-center">
            {loading && (
              <div className="flex justify-center items-center gap-1">
                <span className="text-sm font-medium animate-pulse text-gray-300">Cargando</span>
                <span className="text-sm font-medium animate-pulse text-gray-400" style={{ animationDelay: '150ms' }}>.</span>
                <span className="text-sm font-medium animate-pulse text-gray-500" style={{ animationDelay: '300ms' }}>.</span>
                <span className="text-sm font-medium animate-pulse text-gray-600" style={{ animationDelay: '450ms' }}>.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Join Channel Modal */}
      {selectedChannel && (
        <div id="popup-modal" tabIndex={-1} className="flex overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full bg-black/50 backdrop-blur-sm">
          <div className="relative p-4 w-full max-w-md max-h-full">
            <div className="relative bg-neutral-primary-soft border border-default rounded-base shadow-sm p-4 md:p-6 bg-background">
              <button
                type="button"
                onClick={handleCloseModal}
                className="absolute top-3 end-2.5 text-body bg-transparent hover:bg-neutral-tertiary hover:text-heading rounded-base text-sm w-9 h-9 ms-auto inline-flex justify-center items-center"
              >
                <svg className="w-5 h-5 text-foreground" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18 17.94 6M18 18 6.06 6" /></svg>
                <span className="sr-only">Close modal</span>
              </button>
              <div className="p-4 md:p-5 text-center">
                <svg className="mx-auto mb-4 text-fg-disabled w-12 h-12 text-muted-foreground" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 13V8m0 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                <h3 className="mb-6 text-body text-foreground font-medium text-lg">
                  ¿Estás seguro de que quieres unirte al canal <span className="font-bold">#{selectedChannel.name}</span>?
                </h3>
                <div className="flex items-center space-x-4 justify-center">
                  <button
                    onClick={handleJoinChannel}
                    disabled={isJoining}
                    type="button"
                    className="text-white bg-brand box-border border border-transparent bg-primary hover:bg-primary/90 focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none flex items-center gap-2 disabled:opacity-50"
                  >
                    {isJoining ? 'Uniéndose...' : "Sí, unirme"}
                  </button>
                  <button
                    onClick={handleCloseModal}
                    type="button"
                    className="text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none text-foreground border-border hover:bg-muted"
                  >
                    No, cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
