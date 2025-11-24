'use client';

import { useState, useEffect } from 'react';
import { Channel, ChannelMember, User } from '@/types';

interface ChannelSettingsSidebarProps {
    channel: Channel;
    user: User;
    isOpen: boolean;
    onClose: () => void;
    onChannelUpdated: () => void;
}

type AlertType = 'success' | 'error' | 'warning' | 'info';

export function ChannelSettingsSidebar({
    channel,
    user,
    isOpen,
    onClose,
    onChannelUpdated,
}: ChannelSettingsSidebarProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [channelName, setChannelName] = useState(channel.name);
    const [channelType, setChannelType] = useState<'public' | 'private'>(channel.channel_type);
    const [ownerId, setOwnerId] = useState(channel.owner_id);
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isReactivating, setIsReactivating] = useState(false);
    const [alert, setAlert] = useState<{ type: AlertType; message: string } | null>(null);

    // Members state
    const [showMembers, setShowMembers] = useState(false);
    const [members, setMembers] = useState<ChannelMember[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [membersPage, setMembersPage] = useState(1);
    const [hasMoreMembers, setHasMoreMembers] = useState(true);

    const isOwner = channel.owner_id === user.id;

    // Reset form when channel changes
    useEffect(() => {
        setChannelName(channel.name);
        setChannelType(channel.channel_type);
        setOwnerId(channel.owner_id);
        setIsEditing(false);
    }, [channel]);

    const loadMembers = async (page: number = 1) => {
        try {
            setLoadingMembers(true);
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/channels/members/channel/${channel.id}?page=${page}&page_size=10`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Error loading members');
            }

            const data: ChannelMember[] = await response.json();

            if (page === 1) {
                setMembers(data);
            } else {
                setMembers(prev => [...prev, ...data]);
            }

            setHasMoreMembers(data.length === 10);
            setMembersPage(page);
        } catch (error) {
            console.error('Error loading members:', error);
            setAlert({ type: 'error', message: 'Error al cargar los miembros del canal' });
        } finally {
            setLoadingMembers(false);
        }
    };

    const handleToggleMembers = () => {
        if (!showMembers) {
            loadMembers(1);
        }
        setShowMembers(!showMembers);
    };

    const handleLoadMoreMembers = () => {
        if (!loadingMembers && hasMoreMembers) {
            loadMembers(membersPage + 1);
        }
    };

    const handleSaveChanges = async () => {
        try {
            setIsSaving(true);
            setAlert(null);

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/channels/channels/${channel.id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: channelName,
                        channel_type: channelType,
                        owner_id: ownerId,
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || errorData.message || 'Error al actualizar el canal');
            }

            setAlert({ type: 'success', message: 'Canal actualizado exitosamente' });
            setIsEditing(false);
            onChannelUpdated();
        } catch (error) {
            console.error('Error updating channel:', error);
            setAlert({
                type: 'error',
                message: error instanceof Error ? error.message : 'Error al actualizar el canal',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteChannel = async () => {
        try {
            setIsDeleting(true);
            setAlert(null);

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/channels/channels/${channel.id}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || errorData.message || 'Error al desactivar el canal');
            }

            setAlert({ type: 'success', message: 'Canal desactivado exitosamente' });
            setShowDeleteModal(false);
            onChannelUpdated();
            setTimeout(() => onClose(), 2000);
        } catch (error) {
            console.error('Error deleting channel:', error);
            setAlert({
                type: 'error',
                message: error instanceof Error ? error.message : 'Error al desactivar el canal',
            });
            setShowDeleteModal(false);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleReactivateChannel = async () => {
        try {
            setIsReactivating(true);
            setAlert(null);

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/channels/channels/${channel.id}/reactivate`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || errorData.message || 'Error al reactivar el canal');
            }

            setAlert({ type: 'success', message: 'Canal reactivado exitosamente' });
            onChannelUpdated();
        } catch (error) {
            console.error('Error reactivating channel:', error);
            setAlert({
                type: 'error',
                message: error instanceof Error ? error.message : 'Error al reactivar el canal',
            });
        } finally {
            setIsReactivating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="w-96 bg-background border-l border-border  flex flex-col h-full">
                {/* Header */}
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <h2 className="text-lg font-bold text-foreground">Configuración del Canal</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-md transition-colors cursor-pointer"
                    >
                        <svg className="w-4 h-4 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Alert */}
                    {alert && (
                        <div
                            className={`p-4 rounded-md text-white font-bold ${alert.type === 'success'
                                ? 'bg-success'
                                : alert.type === 'error'
                                    ? 'bg-danger'
                                    : alert.type === 'warning'
                                        ? 'bg-warning'
                                        : 'bg-muted text-foreground'
                                }`}
                        >
                            <p className="text-sm font-medium">{alert.message}</p>
                        </div>
                    )}

                    {/* Channel Info */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Nombre del Canal
                            </label>
                            {isEditing && isOwner ? (
                                <input
                                    type="text"
                                    value={channelName}
                                    onChange={(e) => setChannelName(e.target.value)}
                                    className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            ) : (
                                <p className="text-foreground font-medium">#{channel.name}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                ID del Canal
                            </label>
                            <p className="text-foreground text-sm font-mono break-all">{channel.id}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Tipo de Canal
                            </label>
                            {isEditing && isOwner ? (
                                <select
                                    value={channelType}
                                    onChange={(e) => setChannelType(e.target.value as 'public' | 'private')}
                                    className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="public">Público</option>
                                    <option value="private">Privado</option>
                                </select>
                            ) : (
                                <p className="text-foreground">
                                    {channel.channel_type === 'public' ? 'Público' : 'Privado'}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                ID del Propietario
                            </label>
                            {isEditing && isOwner ? (
                                <input
                                    type="text"
                                    value={ownerId}
                                    onChange={(e) => setOwnerId(e.target.value)}
                                    className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            ) : (
                                <p className="text-foreground text-sm font-mono">{channel.owner_id}</p>
                            )}
                        </div>

                        {/* Edit/Save Buttons */}
                        {isOwner && (
                            <div className="flex gap-2">
                                {isEditing ? (
                                    <>
                                        <button
                                            onClick={handleSaveChanges}
                                            disabled={isSaving}
                                            className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsEditing(false);
                                                setChannelName(channel.name);
                                                setChannelType(channel.channel_type);
                                                setOwnerId(channel.owner_id);
                                            }}
                                            disabled={isSaving}
                                            className="px-4 py-2 border border-border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-foreground"
                                        >
                                            Cancelar
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors cursor-pointer"
                                    >
                                        Editar Canal
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Add User Section - Only for private channels and owners */}
                    {isOwner && channel.channel_type === 'private' && (
                        <div className="border-t border-border pt-4 space-y-3">
                            <h3 className="text-sm font-medium text-foreground">Agregar Usuario</h3>
                            <p className="text-xs text-muted-foreground">
                                Agrega usuarios al canal privado ingresando su ID
                            </p>
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    placeholder="ID del usuario"
                                    className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    id="add-user-input"
                                />
                                <button
                                    onClick={async () => {
                                        const input = document.getElementById('add-user-input') as HTMLInputElement;
                                        const userId = input?.value.trim();

                                        if (!userId) {
                                            setAlert({ type: 'error', message: 'Por favor ingresa un ID de usuario' });
                                            return;
                                        }

                                        try {
                                            setAlert(null);
                                            const response = await fetch(
                                                `${process.env.NEXT_PUBLIC_API_URL}/api/channels/members/`,
                                                {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                    },
                                                    body: JSON.stringify({
                                                        channel_id: channel.id,
                                                        user_id: userId,
                                                    }),
                                                }
                                            );

                                            if (!response.ok) {
                                                const errorData = await response.json().catch(() => ({}));
                                                throw new Error(errorData.detail || errorData.message || 'Error al agregar usuario');
                                            }

                                            setAlert({ type: 'success', message: `Usuario ${userId} agregado exitosamente` });
                                            input.value = '';
                                            onChannelUpdated();
                                        } catch (error) {
                                            console.error('Error adding user:', error);
                                            setAlert({
                                                type: 'error',
                                                message: error instanceof Error ? error.message : 'Error al agregar usuario',
                                            });
                                        }
                                    }}
                                    className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors cursor-pointer"
                                >
                                    Agregar Usuario
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Members Section */}
                    <div className="border-t border-border pt-4">
                        <button
                            onClick={handleToggleMembers}
                            className="w-full flex items-center justify-between p-3 rounded-md hover:bg-muted transition-colors cursor-pointer"
                        >
                            <span className="font-medium text-foreground">Lista de Usuarios</span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">{channel.user_count} miembros</span>
                                <svg
                                    className={`w-5 h-5 text-foreground transition-transform ${showMembers ? 'rotate-180' : ''
                                        }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </button>

                        {showMembers && (
                            <div className="mt-2 space-y-2">
                                {loadingMembers && members.length === 0 ? (
                                    <div className="text-center py-4 text-muted-foreground text-sm">
                                        Cargando miembros...
                                    </div>
                                ) : members.length === 0 ? (
                                    <div className="text-center py-4 text-muted-foreground text-sm">
                                        No hay miembros en este canal
                                    </div>
                                ) : (
                                    <>
                                        {members.map((member) => (
                                            <div
                                                key={member.id}
                                                className="p-3 rounded-md bg-muted border border-border"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-foreground">{member.id}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Unido: {new Date(member.joined_at * 1000).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`text-xs px-2 py-1 rounded ${member.status === 'normal'
                                                                ? 'bg-success-soft text-fg-success-strong'
                                                                : member.status === 'banned'
                                                                    ? 'bg-danger-soft text-fg-danger-strong'
                                                                    : 'bg-neutral-secondary-soft text-foreground'
                                                                }`}
                                                        >
                                                            {member.status}
                                                        </span>
                                                        {/* Delete button - Only for private channels and owners, but not for the channel owner */}
                                                        {isOwner && channel.channel_type === 'private' && member.id !== channel.owner_id && (
                                                            <button
                                                                onClick={async () => {
                                                                    // Confirmar eliminación
                                                                    if (!confirm(`¿Estás seguro de que quieres eliminar al usuario ${member.id} del canal?`)) {
                                                                        return;
                                                                    }

                                                                    try {
                                                                        setAlert(null);
                                                                        const response = await fetch(
                                                                            `${process.env.NEXT_PUBLIC_API_URL}/api/channels/members/`,
                                                                            {
                                                                                method: 'DELETE',
                                                                                headers: {
                                                                                    'Content-Type': 'application/json',
                                                                                },
                                                                                body: JSON.stringify({
                                                                                    channel_id: channel.id,
                                                                                    user_id: member.id,
                                                                                }),
                                                                            }
                                                                        );

                                                                        if (!response.ok) {
                                                                            const errorData = await response.json().catch(() => ({}));
                                                                            throw new Error(errorData.detail || errorData.message || 'Error al eliminar usuario');
                                                                        }

                                                                        setAlert({ type: 'success', message: `Usuario ${member.id} eliminado exitosamente` });
                                                                        // Recargar la lista de miembros
                                                                        loadMembers(1);
                                                                        onChannelUpdated();
                                                                    } catch (error) {
                                                                        console.error('Error removing user:', error);
                                                                        setAlert({
                                                                            type: 'error',
                                                                            message: error instanceof Error ? error.message : 'Error al eliminar usuario',
                                                                        });
                                                                    }
                                                                }}
                                                                className="p-1.5 hover:bg-danger-soft text-danger rounded-md transition-colors cursor-pointer"
                                                                title="Eliminar usuario"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {hasMoreMembers && (
                                            <button
                                                onClick={handleLoadMoreMembers}
                                                disabled={loadingMembers}
                                                className="w-full px-4 py-2 text-sm text-primary hover:bg-muted rounded-md transition-colors disabled:opacity-50"
                                            >
                                                {loadingMembers ? 'Cargando...' : 'Cargar más'}
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Leave Channel - Only for non-owners */}
                    {!isOwner && (
                        <div className="border-t border-border pt-4 space-y-2">
                            <h3 className="text-sm font-medium text-foreground mb-2">Abandonar Canal</h3>
                            <p className="text-xs text-muted-foreground mb-3">
                                Si abandonas este canal, perderás acceso a todos sus mensajes y threads.
                            </p>
                            <button
                                onClick={async () => {
                                    // Confirmar salida
                                    if (!confirm(`¿Estás seguro de que quieres abandonar el canal "${channel.name}"?`)) {
                                        return;
                                    }

                                    try {
                                        setAlert(null);
                                        const response = await fetch(
                                            `${process.env.NEXT_PUBLIC_API_URL}/api/channels/members/`,
                                            {
                                                method: 'DELETE',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                },
                                                body: JSON.stringify({
                                                    channel_id: channel.id,
                                                    user_id: user.id,
                                                }),
                                            }
                                        );

                                        if (!response.ok) {
                                            const errorData = await response.json().catch(() => ({}));
                                            throw new Error(errorData.detail || errorData.message || 'Error al abandonar el canal');
                                        }

                                        setAlert({ type: 'success', message: 'Has abandonado el canal exitosamente' });
                                        // Cerrar el sidebar y actualizar la lista de canales
                                        setTimeout(() => {
                                            onClose();
                                            onChannelUpdated();
                                        }, 1500);
                                    } catch (error) {
                                        console.error('Error leaving channel:', error);
                                        setAlert({
                                            type: 'error',
                                            message: error instanceof Error ? error.message : 'Error al abandonar el canal',
                                        });
                                    }
                                }}
                                className="w-full px-4 py-2 bg-warning text-white rounded-md hover:bg-warning/90 transition-colors cursor-pointer font-medium"
                            >
                                Abandonar Canal
                            </button>
                        </div>
                    )}

                    {/* Danger Zone */}
                    {isOwner && (
                        <div className="border-t border-border pt-4 space-y-2">
                            <h3 className="text-sm font-medium text-foreground mb-2">Zona de Peligro</h3>
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="w-full px-4 py-2 bg-danger-soft text-fg-danger-strong border border-danger-subtle rounded-md hover:bg-danger-medium transition-colors cursor-pointer"
                            >
                                Desactivar Canal
                            </button>
                            <button
                                onClick={handleReactivateChannel}
                                disabled={isReactivating}
                                className="w-full px-4 py-2 bg-success-soft text-fg-success-strong border border-success-subtle rounded-md hover:bg-success-medium transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                {isReactivating ? 'Reactivando...' : 'Reactivar Canal'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 flex items-center justify-center z-[60]">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowDeleteModal(false)}
                    />
                    <div className="relative bg-background border border-border rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold text-foreground mb-4">
                            ¿Desactivar Canal?
                        </h3>
                        <p className="text-foreground mb-6">
                            ¿Estás seguro de que quieres desactivar el canal <span className="font-bold">#{channel.name}</span>?
                            Esta acción puede ser revertida posteriormente.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleDeleteChannel}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2 bg-danger-soft text-fg-danger-strong border border-danger-subtle rounded-md hover:bg-danger-medium disabled:opacity-50 transition-colors"
                            >
                                {isDeleting ? 'Desactivando...' : 'Sí, Desactivar'}
                            </button>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-muted disabled:opacity-50 transition-colors text-foreground"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
