// Notification Service for managing push notifications
const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';

export class NotificationService {
    private static instance: NotificationService;
    private registration: ServiceWorkerRegistration | null = null;

    private constructor() {}

    public static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    /**
     * Check if notifications are supported
     */
    public isSupported(): boolean {
        return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    }

    /**
     * Get current notification permission
     */
    public getPermission(): NotificationPermission {
        if (!this.isSupported()) {
            return 'denied';
        }
        return Notification.permission;
    }

    /**
     * Request notification permission
     */
    public async requestPermission(): Promise<NotificationPermission> {
        if (!this.isSupported()) {
            console.warn('Notifications are not supported in this browser');
            return 'denied';
        }

        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);
        return permission;
    }

    /**
     * Register service worker
     */
    public async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
        if (!this.isSupported()) {
            console.warn('Service Workers are not supported in this browser');
            return null;
        }

        try {
            const isLocalhost = window.location.hostname === 'localhost' || 
                               window.location.hostname === '127.0.0.1' ||
                               window.location.hostname === '[::1]';
            
            const isHTTPS = window.location.protocol === 'https:';
            
            if (!isLocalhost && !isHTTPS) {
                throw new Error('Service Workers require HTTPS (or localhost for development)');
            }

            this.registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
            });
            
            await navigator.serviceWorker.ready;
            console.log('Service Worker registered successfully');
            
            return this.registration;
        } catch (error: any) {
            console.error('Service Worker registration failed:', error);
            throw new Error(`Service Worker registration failed: ${error.message}`);
        }
    }

    /**
     * Get VAPID public key from server
     */
    private async getVapidPublicKey(): Promise<string> {
        try {
            const response = await fetch(`${API_URL}/notifications/vapid-public-key`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!data.publicKey) {
                throw new Error('No public key in response');
            }
            
            return data.publicKey;
        } catch (error: any) {
            console.error('Error fetching VAPID public key:', error);
            throw new Error(`Failed to fetch VAPID key: ${error.message}`);
        }
    }

    /**
     * Convert base64 string to Uint8Array for VAPID key
     */
    private urlBase64ToUint8Array(base64String: string): Uint8Array {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    /**
     * Subscribe to push notifications
     */
    public async subscribe(userId: number): Promise<PushSubscription | null> {
        if (!this.isSupported()) {
            const error = 'Push notifications are not supported in this browser';
            console.warn(error);
            throw new Error(error);
        }

        const permission = await this.requestPermission();
        if (permission !== 'granted') {
            const error = 'Notification permission not granted';
            console.warn(error);
            throw new Error(error);
        }

        if (!this.registration) {
            this.registration = await this.registerServiceWorker();
        }

        if (!this.registration) {
            const error = 'Service Worker registration failed';
            console.error(error);
            throw new Error(error);
        }

        try {
            const vapidPublicKey = await this.getVapidPublicKey();
            const convertedVapidKey = this.urlBase64ToUint8Array(vapidPublicKey);

            const subscription = await this.registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey as BufferSource,
            });

            await this.sendSubscriptionToServer(userId, subscription);
            console.log('Subscribed to push notifications successfully');

            return subscription;
        } catch (error: any) {
            console.error('Error subscribing to push notifications:', error);
            throw new Error(`Failed to subscribe: ${error.message}`);
        }
    }

    /**
     * Send subscription to server
     */
    private async sendSubscriptionToServer(userId: number, subscription: PushSubscription): Promise<void> {
        try {
            const response = await fetch(`${API_URL}/notifications/subscribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    subscription: subscription.toJSON(),
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server error (${response.status}): ${errorText}`);
            }
        } catch (error: any) {
            console.error('Error sending subscription to server:', error);
            throw new Error(`Failed to save subscription: ${error.message}`);
        }
    }

    /**
     * Unsubscribe from push notifications
     */
    public async unsubscribe(): Promise<void> {
        if (!this.registration) {
            console.warn('No service worker registration found');
            return;
        }

        try {
            const subscription = await this.registration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
                
                // Notify server
                await fetch(`${API_URL}/notifications/unsubscribe`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        endpoint: subscription.endpoint,
                    }),
                });

                console.log('Unsubscribed from push notifications');
            }
        } catch (error) {
            console.error('Error unsubscribing from push notifications:', error);
        }
    }

    /**
     * Get current subscription
     */
    public async getSubscription(): Promise<PushSubscription | null> {
        if (!this.registration) {
            return null;
        }

        try {
            return await this.registration.pushManager.getSubscription();
        } catch (error) {
            console.error('Error getting subscription:', error);
            return null;
        }
    }

    /**
     * Check if user is subscribed
     */
    public async isSubscribed(): Promise<boolean> {
        const subscription = await this.getSubscription();
        return subscription !== null;
    }

    /**
     * Send a test notification
     */
    public async sendTestNotification(userId?: number): Promise<void> {
        try {
            const response = await fetch(`${API_URL}/notifications/test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userId ? { userId } : {}),
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Test notification failed (${response.status}): ${errorText}`);
            }
        } catch (error: any) {
            console.error('Error sending test notification:', error);
            throw new Error(`Failed to send test notification: ${error.message}`);
        }
    }
}

export default NotificationService.getInstance();
