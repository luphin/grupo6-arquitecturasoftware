'use client';

import { useState, useEffect } from 'react';
import { Thread, User } from '@/types';

interface ThreadSettingsSidebarProps {
    thread: Thread;
    user: User;
    isOpen: boolean;
    onClose: () => void;
    onThreadUpdated: () => void;
}

type AlertType = 'success' | 'error' | 'warning' | 'info';

export function ThreadSettingsSidebar({
    thread,
    user,
    isOpen,
    onClose,
    onThreadUpdated,
}: ThreadSettingsSidebarProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [threadName, setThreadName] = useState(thread.thread_name);
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [alert, setAlert] = useState<{ type: AlertType; message: string } | null>(null);

    // Report state
    const [showReportForm, setShowReportForm] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [isReporting, setIsReporting] = useState(false);

    const isCreator = thread.thread_created_by === user.id;

    // Reset form when thread changes
    useEffect(() => {
        setThreadName(thread.thread_name);
        setIsEditing(false);
        setShowReportForm(false);
        setReportReason('');
    }, [thread]);

    const handleSaveChanges = async () => {
        try {
            setIsSaving(true);
            setAlert(null);

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/messages/threads/${thread.thread_id}/edit`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        title: threadName,
                        metadata: {},
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || errorData.message || 'Error al actualizar el hilo');
            }

            setAlert({ type: 'success', message: 'Hilo actualizado exitosamente' });
            setIsEditing(false);
            onThreadUpdated();
        } catch (error) {
            console.error('Error updating thread:', error);
            setAlert({
                type: 'error',
                message: error instanceof Error ? error.message : 'Error al actualizar el hilo',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleReportThread = async () => {
        if (!reportReason.trim()) {
            setAlert({ type: 'error', message: 'Por favor ingresa una razón para el reporte' });
            return;
        }

        try {
            setIsReporting(true);
            setAlert(null);

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/threads/threads/moderation/report/${thread.thread_id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        reason: reportReason,
                        reported_by: user.id,
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || errorData.message || 'Error al reportar el hilo');
            }

            setAlert({ type: 'success', message: 'Hilo reportado exitosamente' });
            setShowReportForm(false);
            setReportReason('');
        } catch (error) {
            console.error('Error reporting thread:', error);
            setAlert({
                type: 'error',
                message: error instanceof Error ? error.message : 'Error al reportar el hilo',
            });
        } finally {
            setIsReporting(false);
        }
    };

    const handleDeleteThread = async () => {
        try {
            setIsDeleting(true);
            setAlert(null);

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/messages/threads/threads/${thread.thread_id}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || errorData.message || 'Error al eliminar el hilo');
            }

            setAlert({ type: 'success', message: 'Hilo eliminado exitosamente' });
            setShowDeleteModal(false);
            onThreadUpdated();
            setTimeout(() => onClose(), 2000);
        } catch (error) {
            console.error('Error deleting thread:', error);
            setAlert({
                type: 'error',
                message: error instanceof Error ? error.message : 'Error al eliminar el hilo',
            });
            setShowDeleteModal(false);
        } finally {
            setIsDeleting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="w-96 bg-background border-l border-border flex flex-col h-full">
                {/* Header */}
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <h2 className="text-lg font-bold text-foreground">Configuración del Hilo</h2>
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
                            className={`p-4 rounded-md text-white ${alert.type === 'success'
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

                    {/* Thread Info */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Nombre del Hilo
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={threadName}
                                    onChange={(e) => setThreadName(e.target.value)}
                                    className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            ) : (
                                <p className="text-foreground font-medium">{thread.thread_name}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Creado por
                            </label>
                            <p className="text-foreground text-sm font-mono">{thread.thread_created_by}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                ID del Hilo
                            </label>
                            <p className="text-foreground text-sm font-mono break-all">{thread.thread_id}</p>
                        </div>

                        {/* Edit/Save Buttons */}
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
                                            setThreadName(thread.thread_name);
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
                                    Editar Hilo
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Report Section */}
                    <div className="border-t border-border pt-4">
                        <button
                            onClick={() => setShowReportForm(!showReportForm)}
                            className="w-full flex items-center justify-between p-3 rounded-md hover:bg-muted transition-colors cursor-pointer"
                        >
                            <span className="font-medium text-foreground">Reportar Hilo</span>
                            <svg
                                className={`w-5 h-5 text-foreground transition-transform ${showReportForm ? 'rotate-180' : ''
                                    }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {showReportForm && (
                            <div className="mt-2 space-y-3 p-3 bg-muted rounded-md">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Razón del reporte
                                    </label>
                                    <textarea
                                        value={reportReason}
                                        onChange={(e) => setReportReason(e.target.value)}
                                        placeholder="Describe por qué estás reportando este hilo..."
                                        rows={4}
                                        className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                    />
                                </div>
                                <button
                                    onClick={handleReportThread}
                                    disabled={isReporting || !reportReason.trim()}
                                    className="w-full px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isReporting ? 'Reportando...' : 'Enviar Reporte'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Danger Zone - Only for creator */}
                    {isCreator && (
                        <div className="border-t border-border pt-4 space-y-2">
                            <h3 className="text-sm font-medium text-foreground mb-2">Zona de Peligro</h3>
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="w-full px-4 py-2 bg-danger-soft text-fg-danger-strong border border-danger-subtle rounded-md hover:bg-danger-medium transition-colors cursor-pointer"
                            >
                                Eliminar Hilo
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
                            ¿Eliminar Hilo?
                        </h3>
                        <p className="text-foreground mb-6">
                            ¿Estás seguro de que quieres eliminar el hilo <span className="font-bold">"{thread.thread_name}"</span>?
                            Esta acción no se puede deshacer.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleDeleteThread}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2 bg-danger-soft text-fg-danger-strong border border-danger-subtle rounded-md hover:bg-danger-medium disabled:opacity-50 transition-colors"
                            >
                                {isDeleting ? 'Eliminando...' : 'Sí, Eliminar'}
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
