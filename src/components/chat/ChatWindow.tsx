'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getMessages, sendMessage } from '@/lib/chatApi';
import { Message, Conversation } from '@/types';
import MessageBubble from './MessageBubble';
import { Send, ArrowLeft, X } from 'lucide-react';

interface ChatWindowProps {
    conversation: Conversation;
    onBack?: () => void;
}

export default function ChatWindow({ conversation, onBack }: ChatWindowProps) {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [pendingMessage, setPendingMessage] = useState<string>('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const prevMessageCountRef = useRef(0);

    // Group reactions with their respective messages
    const messagesWithReactions = messages.filter(m => m.type !== 'REACTION');
    const reactionsByMessageId = messages
        .filter(m => m.type === 'REACTION')
        .reduce((acc, reaction) => {
            const targetId = reaction.replyTo?.id;
            if (targetId) {
                if (!acc[targetId]) acc[targetId] = [];
                acc[targetId].push(reaction);
            }
            return acc;
        }, {} as Record<string, Message[]>);

    useEffect(() => {
        loadMessages();
        // Poll for new messages every 2 seconds
        const interval = setInterval(loadMessages, 2000);
        return () => clearInterval(interval);
    }, [conversation.id]);

    useEffect(() => {
        // Only scroll to bottom on initial load
        if (!loading && prevMessageCountRef.current === 0) {
            scrollToBottom();
            prevMessageCountRef.current = messages.length;
        }
    }, [messages, loading]);

    async function loadMessages() {
        try {
            const data = await getMessages(conversation.id);
            setMessages(data);
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        if (!input.trim() || sending) return;

        // Check if outside 24h window
        if (conversation.isWithin24Hours === false) {
            // Show warning modal
            setPendingMessage(input);
            setShowWarningModal(true);
            return;
        }

        // Send directly if within 24h window
        await sendMessageConfirmed(input);
    }

    async function sendMessageConfirmed(textToSend: string) {
        setSending(true);
        try {
            await sendMessage(conversation.id, textToSend, replyingTo?.id);
            setInput('');
            setPendingMessage('');
            setReplyingTo(null);
            setShowWarningModal(false);
            await loadMessages(); // Reload to get the sent message
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Falha ao enviar mensagem');
        } finally {
            setSending(false);
        }
    }

    function handleConfirmSend() {
        sendMessageConfirmed(pendingMessage);
    }

    function handleCancelSend() {
        setShowWarningModal(false);
        setPendingMessage('');
    }

    function handleReply(message: Message) {
        setReplyingTo(message);
    }

    function cancelReply() {
        setReplyingTo(null);
    }

    function scrollToBottom() {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            {/* Warning Modal */}
            {showWarningModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="shrink-0">
                                <svg
                                    className="w-6 h-6 text-yellow-600 dark:text-yellow-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    Atenção: Fora da Janela de 24h
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    Já se passaram mais de 24 horas desde a última mensagem recebida ou template enviado. 
                                    Enviar mensagens normais fora desse período provavelmente falhará devido às políticas do WhatsApp.
                                </p>
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Recomendações:
                                </p>
                                <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1 mb-4">
                                    <li>Use uma mensagem template aprovada, ou</li>
                                    <li>Aguarde o contato enviar uma mensagem primeiro</li>
                                </ul>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    Deseja tentar enviar mesmo assim?
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={handleCancelSend}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmSend}
                                disabled={sending}
                                className="px-4 py-2 bg-yellow-600 text-white hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
                            >
                                {sending ? 'Enviando...' : 'Enviar Mesmo Assim'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-4 flex items-center gap-3">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <ArrowLeft size={20} className="text-gray-900 dark:text-gray-100" />
                    </button>
                )}
                <button
                    onClick={() => router.push(`/chat/contact/${conversation.contact.id}`)}
                    className="flex items-center gap-3 flex-1 hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
                >
                    <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <span className="text-white font-semibold">
                            {(conversation.contact.customName || conversation.contact.name)?.[0]?.toUpperCase() || '?'}
                        </span>
                    </div>
                    <div className="text-left">
                        <h2 className="font-semibold text-gray-900 dark:text-white">
                            {conversation.contact.customName || conversation.contact.name || conversation.contact.waId}
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{conversation.contact.waId}</p>
                    </div>
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    </div>
                ) : (
                    <>
                        {messagesWithReactions.map((message) => (
                            <MessageBubble 
                                key={message.id} 
                                message={message} 
                                onReply={handleReply}
                                reactions={reactionsByMessageId[message.id] || []}
                            />
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 p-4">
                {/* Reply Preview */}
                {replyingTo && (
                    <div className="mb-2 flex items-start gap-2 bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                Respondendo a {replyingTo.direction === 'OUTBOUND' ? 'você mesmo' : replyingTo.contact?.name || 'contato'}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                {replyingTo.textBody || replyingTo.caption || 'Mensagem'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={cancelReply}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                        >
                            <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>
                )}
                
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Digite uma mensagem..."
                        className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-green-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        disabled={sending}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || sending}
                        className="bg-green-600 text-white p-2 rounded-full hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </form>
        </div>
    );
}
