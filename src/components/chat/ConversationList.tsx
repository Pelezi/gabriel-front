'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getConversations } from '@/lib/chatApi';
import { Conversation } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ConversationListProps {
  onSelectConversation: (conversation: Conversation) => void;
  selectedId?: string;
}

export default function ConversationList({
  onSelectConversation,
  selectedId,
}: ConversationListProps) {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
    // Poll for new conversations every 5 seconds
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadConversations() {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r dark:border-gray-700">
      {/* Header */}
      <div className="p-4 pl-15 border-b dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Conversas</h2>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p>Nenhuma conversa ainda</p>
          </div>
        ) : (
          conversations.map((conversation) => {
            const lastMessage = conversation.messages[0];
            const isSelected = conversation.id === selectedId;

            return (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation)}
                className={`p-4 border-b dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                  isSelected ? 'bg-gray-100 dark:bg-gray-700' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/chat/contact/${conversation.contact.id}`);
                    }}
                    className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center shrink-0 hover:opacity-80 transition-opacity"
                  >
                    <span className="text-white font-semibold text-lg">
                      {(conversation.contact.customName || conversation.contact.name)?.[0]?.toUpperCase() || '?'}
                    </span>
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2 flex-1">
                        <h3 className="font-semibold truncate text-gray-900 dark:text-white">
                          {conversation.contact.customName || conversation.contact.name || conversation.contact.waId}
                        </h3>
                        {/* 24h Window Indicator */}
                        {conversation.isWithin24Hours !== undefined && (
                          <span
                            className="shrink-0"
                            title={
                              conversation.isWithin24Hours
                                ? 'Dentro da janela de 24h - pode enviar mensagens normais'
                                : 'Fora da janela de 24h - apenas templates funcionarão'
                            }
                          >
                            {conversation.isWithin24Hours ? (
                              <svg
                                className="w-5 h-5 text-green-600 dark:text-green-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-5 h-5 text-red-600 dark:text-red-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                        {lastMessage?.textBody || getMessagePreview(lastMessage)}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-2">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function getMessagePreview(message: any): string {
  if (!message) return '';
  
  switch (message.type) {
    case 'IMAGE': return '📷 Imagem';
    case 'VIDEO': return '🎥 Vídeo';
    case 'AUDIO': return message.isVoice ? '🎤 Áudio' : '🎵 Áudio';
    case 'STICKER': return '🎨 Figurinha';
    case 'DOCUMENT': return `📄 ${message.mediaFilename || 'Documento'}`;
    case 'LOCATION': return '📍 Localização';
    default: return 'Mensagem';
  }
}
