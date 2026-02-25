'use client';

import { Message } from '@/types';
import { format } from 'date-fns';
import { Check, CheckCheck, MapPin, FileText, Volume2, Reply } from 'lucide-react';
import Image from 'next/image';

interface MessageBubbleProps {
  message: Message;
  onReply?: (message: Message) => void;
  reactions?: Message[]; // Reaction messages for this message
}

function getMessageTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    IMAGE: '📷 Imagem',
    VIDEO: '🎥 Vídeo',
    AUDIO: '🎵 Áudio',
    STICKER: '🎨 Sticker',
    DOCUMENT: '📄 Documento',
    LOCATION: '📍 Localização',
    UNSUPPORTED: 'Mensagem não suportada',
  };
  return labels[type] || 'Mensagem';
}

export default function MessageBubble({ message, onReply, reactions = [] }: MessageBubbleProps) {
  const isOutbound = message.direction === 'OUTBOUND';
  const timestamp = new Date(Number(message.timestamp));

  return (
    <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'} group`}>
      <div
        className={`max-w-[70%] rounded-lg p-3 relative ${
          isOutbound
            ? 'bg-green-600 dark:bg-green-700 text-white rounded-br-none'
            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none shadow'
        }`}
      >
        {/* Reply button - appears on hover */}
        {onReply && (
          <button
            onClick={() => onReply(message)}
            className={`absolute ${isOutbound ? '-left-8' : '-right-8'} top-1/2 -translate-y-1/2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
              isOutbound
                ? 'bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-800'
                : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'
            }`}
            title="Responder"
          >
            <Reply className={`w-4 h-4 ${isOutbound ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`} />
          </button>
        )}
        {/* Replied Message Preview */}
            {message.replyTo && (
              <div
                className={`mb-2 pl-3 py-2 border-l-4 ${
                  isOutbound
                ? 'border-green-300 bg-green-500/20'
                : 'border-gray-400 dark:border-gray-500 bg-gray-100 dark:bg-gray-600'
                } rounded text-sm overflow-hidden`}
              >
                <p className={`font-semibold text-xs ${isOutbound ? 'text-green-100' : 'text-gray-600 dark:text-gray-300'}`}>
                  {message.replyTo.direction === 'OUTBOUND' ? 'Você' : (message.replyTo.contact?.name || message.contact?.name || 'Contato')}
                </p>
                <p className={`line-clamp-2 text-xs wrap-break-words ${isOutbound ? 'text-green-100' : 'text-gray-500 dark:text-gray-400'}`}>
                  {message.replyTo.textBody || message.replyTo.caption || getMessageTypeLabel(message.replyTo.type)}
                </p>
              </div>
            )}

        {/* Message Content */}
        <MessageContent message={message} isOutbound={isOutbound} />

        {/* Reactions */}
        {reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-opacity-20 border-white dark:border-gray-600">
            {reactions.map((reaction) => (
              <span
                key={reaction.id}
                className={`text-lg px-2 py-1 rounded-full ${
                  isOutbound
                    ? 'bg-green-500/30'
                    : 'bg-gray-200 dark:bg-gray-600'
                }`}
                title={`Reação de ${reaction.contact?.name || 'Contato'}`}
              >
                {reaction.reactionEmoji}
              </span>
            ))}
          </div>
        )}

        {/* Footer with timestamp and status */}
        <div
          className={`flex items-center gap-1 mt-1 text-xs ${
            isOutbound ? 'text-green-100' : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <span>{format(timestamp, 'HH:mm')}</span>
          {isOutbound && <MessageStatusIcon status={message.status} />}
        </div>
      </div>
    </div>
  );
}

function MessageContent({ message, isOutbound }: { message: Message; isOutbound: boolean }) {
  switch (message.type) {
    case 'TEXT':
      // Check if it's a template message
      if (message.templateHeader || message.templateFooter) {
        return (
          <div className="space-y-2">
            {message.templateHeader && (
              <p className="font-bold text-base whitespace-pre-wrap wrap-break-words">
                {message.templateHeader}
              </p>
            )}
            {message.textBody && (
              <p className="whitespace-pre-wrap wrap-break-words">{message.textBody}</p>
            )}
            {message.templateFooter && (
              <p className={`text-xs whitespace-pre-wrap wrap-break-words mt-2 ${
                isOutbound ? 'text-green-200' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {message.templateFooter}
              </p>
            )}
          </div>
        );
      }
      // Regular text message
      return <p className="whitespace-pre-wrap wrap-break-words">{message.textBody}</p>;

    case 'IMAGE':
      return (
        <div>
          {message.mediaLocalPath ? (
            <Image
              src={message.mediaLocalPath}
              alt="Image"
              width={300}
              height={300}
              className="rounded-lg mb-2"
              unoptimized
            />
          ) : message.textBody ? (
            <p className="text-red-500 dark:text-red-400 text-sm italic mb-2">{message.textBody}</p>
          ) : null}
          {message.caption && (
            <p className="whitespace-pre-wrap wrap-break-words">{message.caption}</p>
          )}
        </div>
      );

    case 'VIDEO':
      return (
        <div>
          {message.mediaLocalPath ? (
            <video
              src={message.mediaLocalPath}
              controls
              className="rounded-lg mb-2 max-w-full"
            />
          ) : message.textBody ? (
            <p className="text-red-500 dark:text-red-400 text-sm italic mb-2">{message.textBody}</p>
          ) : null}
          {message.caption && (
            <p className="whitespace-pre-wrap wrap-break-words">{message.caption}</p>
          )}
        </div>
      );

    case 'AUDIO':
      return (
        <div className="flex items-center gap-2">
          {message.mediaLocalPath ? (
            <>
              <Volume2 className="w-5 h-5" />
              <audio src={message.mediaLocalPath} controls className="max-w-full" />
              <span className="text-sm">{message.isVoice ? 'Áudio' : 'Arquivo de áudio'}</span>
            </>
          ) : message.textBody ? (
            <p className="text-red-500 dark:text-red-400 text-sm italic">{message.textBody}</p>
          ) : null}
        </div>
      );

    case 'STICKER':
      return (
        <div>
          {message.mediaLocalPath ? (
            <Image
              src={message.mediaLocalPath}
              alt="Sticker"
              width={150}
              height={150}
              className="rounded"
              unoptimized
            />
          ) : message.textBody ? (
            <p className="text-red-500 dark:text-red-400 text-sm italic">{message.textBody}</p>
          ) : null}
        </div>
      );

    case 'DOCUMENT':
      return (
        <div>
          {message.mediaLocalPath ? (
            <a
              href={message.mediaLocalPath || '#'}
              download
              className={`flex items-center gap-2 ${
                isOutbound ? 'text-white hover:underline' : 'text-blue-600 hover:underline'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span>{message.mediaFilename || 'Document'}</span>
            </a>
          ) : message.textBody ? (
            <p className="text-red-500 dark:text-red-400 text-sm italic">{message.textBody}</p>
          ) : null}
        </div>
      );

    case 'LOCATION':
      return (
        <div className="flex items-start gap-2">
          <MapPin className="w-5 h-5 shrink-0 mt-1" />
          <div>
            <p className="font-semibold">Localização compartilhada</p>
            <a
              href={`https://www.google.com/maps?q=${message.latitude},${message.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-sm ${
                isOutbound ? 'text-green-100 hover:underline' : 'text-blue-600 hover:underline'
              }`}
            >
              Ver no mapa
            </a>
          </div>
        </div>
      );

    case 'REACTION':
      return (
        <div className="flex items-center gap-2">
          <span className="text-2xl">{message.reactionEmoji}</span>
          <span className="text-sm">Reagiu à mensagem</span>
        </div>
      );

    case 'UNSUPPORTED':
      return (
        <div>
          {message.textBody ? (
            <p className={`text-sm ${
              message.textBody.includes('[❌ Erro') || message.textBody.includes('[Erro')
                ? 'text-red-500 dark:text-red-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {message.textBody}
            </p>
          ) : (
            <p className="text-sm italic text-gray-600 dark:text-gray-400">
              {isOutbound ? 'Mensagem não suportada' : 'Tipo de mensagem não suportado'}
            </p>
          )}
        </div>
      );

    default:
      return <p>Mensagem desconhecida</p>;
  }
}

function MessageStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'SENT':
      return <Check className="w-4 h-4" />;
    case 'DELIVERED':
      return <CheckCheck className="w-4 h-4" />;
    case 'READ':
      return <CheckCheck className="w-4 h-4 text-blue-400" />;
    case 'FAILED':
      return <span className="text-red-400">!</span>;
    default:
      return null;
  }
}
