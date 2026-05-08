'use client';

import { useState, useEffect, useCallback } from 'react';
import notificationService from '@/services/notificationService';

export interface UseNotificationsReturn {
    isSupported: boolean;
    permission: NotificationPermission;
    isSubscribed: boolean;
    isLoading: boolean;
    error: string | null;
    subscribe: (userId: number) => Promise<void>;
    unsubscribe: () => Promise<void>;
    requestPermission: () => Promise<NotificationPermission>;
    sendTestNotification: (userId?: number) => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
    const [isSupported, setIsSupported] = useState<boolean>(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Check support and initial state
    useEffect(() => {
        const initializeNotifications = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const supported = notificationService.isSupported();
                setIsSupported(supported);

                if (supported) {
                    const currentPermission = notificationService.getPermission();
                    setPermission(currentPermission);

                    const subscribed = await notificationService.isSubscribed();
                    setIsSubscribed(subscribed);
                }
            } catch (err) {
                console.error('Error initializing notifications:', err);
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setIsLoading(false);
            }
        };

        initializeNotifications();
    }, []);

    const subscribe = useCallback(async (userId: number) => {
        try {
            setIsLoading(true);
            setError(null);

            const subscription = await notificationService.subscribe(userId);
            if (subscription) {
                setIsSubscribed(true);
                setPermission('granted');
            } else {
                throw new Error('Failed to subscribe to notifications');
            }
        } catch (err) {
            console.error('Error subscribing to notifications:', err);
            setError(err instanceof Error ? err.message : 'Failed to subscribe');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const unsubscribe = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            await notificationService.unsubscribe();
            setIsSubscribed(false);
        } catch (err) {
            console.error('Error unsubscribing from notifications:', err);
            setError(err instanceof Error ? err.message : 'Failed to unsubscribe');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const requestPermission = useCallback(async () => {
        try {
            setError(null);
            const newPermission = await notificationService.requestPermission();
            setPermission(newPermission);
            return newPermission;
        } catch (err) {
            console.error('Error requesting permission:', err);
            setError(err instanceof Error ? err.message : 'Failed to request permission');
            throw err;
        }
    }, []);

    const sendTestNotification = useCallback(async (userId?: number) => {
        try {
            setError(null);
            await notificationService.sendTestNotification(userId);
        } catch (err) {
            console.error('Error sending test notification:', err);
            setError(err instanceof Error ? err.message : 'Failed to send test notification');
            throw err;
        }
    }, []);

    return {
        isSupported,
        permission,
        isSubscribed,
        isLoading,
        error,
        subscribe,
        unsubscribe,
        requestPermission,
        sendTestNotification,
    };
}
