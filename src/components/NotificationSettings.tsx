'use client';

import React, { useEffect, useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import toast from 'react-hot-toast';

export interface NotificationSettingsProps {
    userId?: number;
}

export function NotificationSettings({ userId }: NotificationSettingsProps) {
    const {
        isSupported,
        permission,
        isSubscribed,
        isLoading,
        error,
        subscribe,
        unsubscribe,
        requestPermission,
        sendTestNotification,
    } = useNotifications();

    const [showTestButton, setShowTestButton] = useState(false);

    useEffect(() => {
        // Show test button only if subscribed
        setShowTestButton(isSubscribed);
    }, [isSubscribed]);

    if (!isSupported) {
        return (
            <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ Push notifications are not supported in this browser.
                </p>
            </div>
        );
    }

    const handleSubscribe = async () => {
        if (!userId) {
            alert('User ID is required to subscribe to notifications');
            return;
        }

        try {
            if (permission === 'default') {
                const newPermission = await requestPermission();
                if (newPermission !== 'granted') {
                    return;
                }
            }
            await subscribe(userId);
        } catch (err) {
            console.error('Failed to subscribe:', err);
        }
    };

    const handleUnsubscribe = async () => {
        try {
            await unsubscribe();
        } catch (err) {
            console.error('Failed to unsubscribe:', err);
        }
    };

    const handleTestNotification = async () => {
        try {
            // First, show a local browser notification using the service worker API.
            // Android Chrome can throw on `new Notification(...)` in some contexts.
            if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
                try {
                    const registration = await navigator.serviceWorker.ready;
                    await registration.showNotification('Teste de Notificação', {
                        body: 'Notificações estão funcionando!',
                        icon: '/icon-192x192.png',
                        badge: '/badge-72x72.png',
                        tag: 'local-notification-test',
                        data: { url: '/chat' },
                    });
                } catch (localNotificationError) {
                    console.warn('Local notification preview failed:', localNotificationError);
                }
            }

            // Always send the server-side push notification test.
            await sendTestNotification(userId);
            toast.success('Notificação de teste enviada!');
        } catch (err) {
            console.error('Failed to send test notification:', err);
            toast.error('Erro ao enviar notificação de teste');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Notificações Push</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Receba notificações de novas mensagens mesmo quando o site estiver fechado
                    </p>
                </div>
            </div>

            {error && (
                <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                    <p className="text-sm text-red-800 dark:text-red-200">
                        ❌ {error}
                    </p>
                </div>
            )}

            <div className="flex flex-col gap-3">
                {/* Permission Status */}
                <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Status:</span>
                    <span className={`inline-flex items-center gap-1 ${
                        permission === 'granted' ? 'text-green-600 dark:text-green-400' :
                        permission === 'denied' ? 'text-red-600 dark:text-red-400' :
                        'text-gray-600 dark:text-gray-400'
                    }`}>
                        {permission === 'granted' && '✓ Permitido'}
                        {permission === 'denied' && '✗ Bloqueado'}
                        {permission === 'default' && '○ Não solicitado'}
                    </span>
                </div>

                {/* Subscription Status */}
                <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Inscrição:</span>
                    <span className={`inline-flex items-center gap-1 ${
                        isSubscribed ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                        {isLoading ? '⏳ Carregando...' : isSubscribed ? '✓ Ativo' : '○ Inativo'}
                    </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                    {permission === 'denied' && (
                        <p className="text-sm text-red-600 dark:text-red-400">
                            As notificações foram bloqueadas. Por favor, habilite-as nas configurações do navegador.
                        </p>
                    )}

                    {permission !== 'denied' && !isSubscribed && (
                        <button
                            onClick={handleSubscribe}
                            disabled={isLoading || !userId}
                            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Ativando...' : '🔔 Ativar Notificações'}
                        </button>
                    )}

                    {isSubscribed && (
                        <>
                            <button
                                onClick={handleUnsubscribe}
                                disabled={isLoading}
                                className="inline-flex items-center justify-center rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Desativando...' : '🔕 Desativar Notificações'}
                            </button>

                            {showTestButton && (
                                <button
                                    onClick={handleTestNotification}
                                    disabled={isLoading}
                                    className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    🧪 Testar Notificação
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Help Text */}
            <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                    O botão de teste envia duas notificações: uma direta (instantânea) e uma push (pode levar alguns segundos).
                    {!isSubscribed && ' Você precisa ativar as notificações primeiro!'}gador ou muda de aba.
                    Você receberá notificações de novas mensagens recebidas e enviadas através do bot.
                </p>
            </div>
        </div>
    );
}

export default NotificationSettings;
