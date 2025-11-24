'use client';

import { useState, useEffect } from 'react';
import { Channel, User } from '@/types';
import { FiLock, FiGlobe } from "react-icons/fi";

interface ChannelSearchProps {
  onChannelSelect: (channelId: string, channelName: string) => void;
  user: User; // Asegúrate de pasar el usuario desde el componente padre
  onChannelJoined?: () => void; // Callback para refrescar la lista de canales
}

type AlertType = 'success' | 'error' | 'warning' | 'info' | 'dark' | null;

export function ChannelSearch({ onChannelSelect, user, onChannelJoined }: ChannelSearchProps) {
  // Estados de carga de datos
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Estados para Modal y Alertas
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  // Estado de alerta con mensaje personalizado
  const [alert, setAlert] = useState<{ type: AlertType; message?: string } | null>(null);

  useEffect(() => {
    loadChannels(1);
  }, []);

  // --- Lógica de Carga de Canales ---
  const loadChannels = async (pageNum: number) => {
    try {
      setLoading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/channels/channels/?page=${pageNum}&page_size=10`,
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error('Error loading channels');
      }

      const data = await response.json();

      if (Array.isArray(data) && data.length === 0) {
        setHasMore(false);
      } else if (Array.isArray(data)) {
        setChannels(prev => pageNum === 1 ? data : [...prev, ...data]);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error loading channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadChannels(page + 1);
    }
  };

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Lógica de Unirse al Canal ---

  const handleOpenModal = (channel: Channel) => {
    // No permitir abrir modal para canales privados
    if (channel.channel_type === 'private') {
      setAlert({
        type: 'warning',
        message: 'Este canal es privado. Solo puedes unirte por invitación.'
      });
      return;
    }

    setAlert(null); // Limpiar alertas previas
    setSelectedChannel(channel);
  };

  const handleCloseModal = () => {
    setSelectedChannel(null);
  };

  const handleJoinChannel = async () => {
    // 1. LOGS DE DEPURACIÓN
    console.log("Intentando unirse al canal:", {
      channel: selectedChannel,
      user_id: user?.id
    });

    if (!selectedChannel) return;

    // 2. VALIDACIÓN DE USUARIO
    // Usamos user?.id para evitar crashes si user es null/undefined momentáneamente
    if (!user || !user.id) {
      console.error("Error: currentUser es undefined o null");
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

      console.log("Enviando payload:", payload);
      console.log("URL del endpoint:", `${process.env.NEXT_PUBLIC_API_URL}/api/channels/members/`);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/channels/members/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Éxito (200 OK)
        setAlert({ type: 'success' });
        handleCloseModal();

        // Refrescar la lista de canales en el ChannelAccordion
        if (onChannelJoined) {
          onChannelJoined();
        }

        // Opcional: Navegar al canal si lo deseas
        // onChannelSelect(selectedChannel.id, selectedChannel.name);
      } else {
        // Error controlado
        console.error("Error en respuesta:", response.status, response.statusText);

        // Intentar leer mensaje de error del backend
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || errorData.message || "Error al conectar con el servidor.";

        // Mensajes específicos según el código de error
        let userMessage = errorMessage;
        if (response.status === 401) {
          userMessage = "Tu sesión ha expirado. Por favor, cierra sesión y vuelve a iniciar sesión.";
        } else if (response.status === 403) {
          userMessage = "No tienes permisos para realizar esta acción.";
        } else if (response.status === 0) {
          userMessage = "Error de conexión (CORS). Verifica la configuración del servidor.";
        }

        setAlert({ type: 'error', message: userMessage });
        handleCloseModal();
      }

    } catch (error) {
      console.error("Error joining channel exception:", error);

      // Detectar errores de CORS
      const errorMessage = error instanceof Error ? error.message : String(error);
      let userMessage = "Ocurrió un error inesperado de red.";

      if (errorMessage.includes('CORS') || errorMessage.includes('NetworkError') || errorMessage.includes('Failed to fetch')) {
        userMessage = "Error de conexión con el servidor. Verifica que el backend esté funcionando y configurado correctamente para CORS.";
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
      <div className="p-4 border-b border-border">
        <input
          type="text"
          placeholder="Buscar canales..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Area de Alertas */}
      {alert && (
        <div className="p-4">
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
        ) : filteredChannels.length === 0 ? (
          <div className="text-center py-8 text-foreground">
            No se encontraron canales
          </div>
        ) : (
          <div className="space-y-1">
            {filteredChannels.map((channel) => {
              const isPrivate = channel.channel_type === 'private';

              return (
                <button
                  key={channel.id}
                  onClick={() => handleOpenModal(channel)}
                  disabled={isPrivate}
                  title={`Propietario: ${channel.owner_id}`}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${isPrivate
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
                  <p className="text-xs text-muted-foreground mt-1 ml-7">
                    {channel.user_count} miembro{channel.user_count !== 1 ? 's' : ''}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && filteredChannels.length > 0 && (
          <div className="mt-4 text-center">
            <button
              onClick={loadMore}
              disabled={loading}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {loading ? 'Cargando...' : 'Cargar más'}
            </button>
          </div>
        )}
      </div>

      {/* --- MODAL --- */}
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
