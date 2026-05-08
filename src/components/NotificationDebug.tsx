'use client';

import React, { useState } from 'react';

interface DebugLog {
    timestamp: string;
    status: 'info' | 'success' | 'error' | 'warning';
    message: string;
}

export function NotificationDebug() {
    const [logs, setLogs] = useState<DebugLog[]>([]);
    const [isRunning, setIsRunning] = useState(false);

    const addLog = (status: DebugLog['status'], message: string) => {
        const log: DebugLog = {
            timestamp: new Date().toLocaleTimeString(),
            status,
            message,
        };
        setLogs((prev) => [...prev, log]);
        console.log(`[${status.toUpperCase()}] ${message}`);
    };

    const runDiagnostics = async () => {
        setIsRunning(true);
        setLogs([]);

        try {
            // 1. Check API connectivity
            addLog('info', 'Checking API connectivity...');
            const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3005/api/v1';
            const healthUrl = apiUrl.replace(/\/api\/v1\/?$/, '/api/v1/health');
            try {
                const healthResponse = await fetch(healthUrl, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });
                if (healthResponse.ok) {
                    addLog('success', `✅ API is reachable: ${apiUrl}`);
                } else {
                    addLog('error', `❌ API returned status ${healthResponse.status}`);
                }
            } catch (err) {
                addLog('error', `❌ API is not reachable: ${err instanceof Error ? err.message : String(err)}`);
            }

            // 2. Check Notification API support
            addLog('info', 'Checking Notification API support...');
            const isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
            if (isSupported) {
                addLog('success', '✅ Notification API is supported');
            } else {
                addLog('error', '❌ Notification API is NOT supported');
                if (!('serviceWorker' in navigator)) addLog('error', '  - Service Worker not available');
                if (!('PushManager' in window)) addLog('error', '  - PushManager not available');
                if (!('Notification' in window)) addLog('error', '  - Notification API not available');
            }

            // 3. Check current permission
            addLog('info', 'Checking notification permission...');
            const permission = Notification.permission;
            addLog('info', `Notification.permission = "${permission}"`);
            if (permission === 'granted') {
                addLog('success', '✅ Permission already granted');
            } else if (permission === 'denied') {
                addLog('error', '❌ Permission denied by user');
            } else {
                addLog('warning', '⚠️ Permission not yet requested');
            }

            // 4. Check HTTPS
            addLog('info', 'Checking HTTPS...');
            const isHTTPS = window.location.protocol === 'https:';
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            if (isHTTPS || isLocalhost) {
                addLog('success', `✅ Protocol is secure: ${window.location.protocol} (Localhost: ${isLocalhost})`);
            } else {
                addLog('error', '❌ HTTPS is required in production');
            }

            // 5. Check Service Worker registration
            addLog('info', 'Checking Service Worker registration...');
            if ('serviceWorker' in navigator) {
                try {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    if (registrations.length > 0) {
                        for (const reg of registrations) {
                            addLog('success', `✅ Service Worker registered: ${reg.scope}`);
                            addLog('info', `  - Active: ${reg.active ? 'Yes' : 'No'}`);
                            addLog('info', `  - Installing: ${reg.installing ? 'Yes' : 'No'}`);
                            addLog('info', `  - Waiting: ${reg.waiting ? 'Yes' : 'No'}`);
                        }
                    } else {
                        addLog('warning', '⚠️ No Service Workers registered');
                    }
                } catch (err) {
                    addLog('error', `❌ Error checking Service Workers: ${err instanceof Error ? err.message : String(err)}`);
                }
            }

            // 6. Fetch VAPID public key
            addLog('info', 'Fetching VAPID public key...');
            try {
                const vapidResponse = await fetch(`${apiUrl}/notifications/vapid-public-key`);
                if (vapidResponse.ok) {
                    const vapidData = await vapidResponse.json();
                    if (vapidData.publicKey) {
                        addLog('success', `✅ VAPID key fetched: ${vapidData.publicKey.substring(0, 20)}...`);
                    } else {
                        addLog('error', '❌ VAPID key is empty');
                    }
                } else {
                    addLog('error', `❌ VAPID endpoint returned ${vapidResponse.status}`);
                }
            } catch (err) {
                addLog('error', `❌ Failed to fetch VAPID key: ${err instanceof Error ? err.message : String(err)}`);
            }

            // 7. Check current subscription
            addLog('info', 'Checking current subscription...');
            try {
                const reg = await navigator.serviceWorker.ready;
                const subscription = await reg.pushManager.getSubscription();
                if (subscription) {
                    addLog('success', '✅ User is subscribed to push notifications');
                    addLog('info', `  - Endpoint: ${subscription.endpoint.substring(0, 50)}...`);
                } else {
                    addLog('warning', '⚠️ User is NOT subscribed');
                }
            } catch (err) {
                addLog('error', `❌ Error checking subscription: ${err instanceof Error ? err.message : String(err)}`);
            }

            // 8. Test browser notification
            addLog('info', 'Testing browser notification...');
            if (Notification.permission === 'granted') {
                try {
                    // Test with show() method
                    const reg = await navigator.serviceWorker.ready;
                    await reg.showNotification('Test Notification', {
                        body: 'This is a test notification',
                        icon: '/icon-192x192.png',
                        badge: '/badge-72x72.png',
                        tag: 'test-notification',
                    });
                    addLog('success', '✅ Browser notification displayed successfully');
                } catch (err) {
                    addLog('error', `❌ Failed to display notification: ${err instanceof Error ? err.message : String(err)}`);
                }
            } else {
                addLog('warning', '⚠️ Cannot test browser notification (permission not granted)');
            }

            addLog('success', '✅ Diagnostics complete!');
        } catch (err) {
            addLog('error', `❌ Unexpected error during diagnostics: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setIsRunning(false);
        }
    };

    const clearLogs = () => {
        setLogs([]);
    };

    return (
        <div className="space-y-4 rounded-lg border border-gray-300 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-900">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">🔧 Notification Debugging</h3>
                <div className="space-x-2">
                    <button
                        onClick={runDiagnostics}
                        disabled={isRunning}
                        className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:bg-gray-400"
                    >
                        {isRunning ? 'Running...' : 'Run Diagnostics'}
                    </button>
                    <button
                        onClick={clearLogs}
                        className="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
                    >
                        Clear
                    </button>
                </div>
            </div>

            <div className="space-y-2 rounded bg-black p-4 font-mono text-sm">
                {logs.length === 0 ? (
                    <div className="text-gray-500">Click "Run Diagnostics" to start debugging...</div>
                ) : (
                    logs.map((log, idx) => (
                        <div
                            key={idx}
                            className={`${
                                log.status === 'success'
                                    ? 'text-green-400'
                                    : log.status === 'error'
                                      ? 'text-red-400'
                                      : log.status === 'warning'
                                        ? 'text-yellow-400'
                                        : 'text-blue-400'
                            }`}
                        >
                            <span className="text-gray-600">[{log.timestamp}]</span> {log.message}
                        </div>
                    ))
                )}
            </div>

            <div className="text-xs text-gray-600 dark:text-gray-400">
                <p>💡 Tip: Open DevTools (F12) → Console to see additional details</p>
            </div>
        </div>
    );
}
