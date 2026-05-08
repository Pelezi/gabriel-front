'use client';

import { useAuth } from '@/contexts/AuthContext';
import NotificationSettings from '@/components/NotificationSettings';

export default function SettingsPage() {
    const { user } = useAuth();

    return (
        <div className="h-full overflow-auto">
            <div className="mx-auto max-w-4xl p-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Configurações
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Gerencie suas preferências e configurações do sistema
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Notifications Section */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <NotificationSettings userId={user?.id ? parseInt(String(user.id)) : undefined} />
                    </div>

                    {/* Account Information */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <h3 className="mb-4 text-lg font-medium">Informações da Conta</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-2">
                                <span className="font-medium">Email:</span>
                                <span className="text-gray-600 dark:text-gray-400">
                                    {user?.email || 'Não informado'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-medium">ID do Usuário:</span>
                                <span className="text-gray-600 dark:text-gray-400">
                                    {user?.id || 'N/A'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-medium">Função:</span>
                                <span className="text-gray-600 dark:text-gray-400">
                                    {user?.role || 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Help Section */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <h3 className="mb-4 text-lg font-medium">Como funcionam as notificações?</h3>
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <p>
                                Receba alertas em tempo real sobre novas mensagens no WhatsApp,
                                convites enviados e seleção de projetos.
                            </p>
                            <p>
                                As notificações funcionam mesmo com o navegador fechado,
                                tanto no desktop quanto no mobile.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
