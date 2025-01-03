'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { FiMessageSquare, FiUsers, FiLogOut } from 'react-icons/fi';

interface Message {
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
  isStatus?: boolean;
  userColor?: string;
  id?: string;
  isOptimistic?: boolean;
}

interface IrcUser {
  userId: string;
  username: string;
  isConnected: boolean;
  userColor: string;
  joinedAt: string;
  lastSeen: string;
  connectionStatus: string;
}

export default function IRC() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<IrcUser[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Cargando IRC...');
  const [lastStatusMessage, setLastStatusMessage] = useState<Message | null>(null);

  const scrollToBottom = useCallback((force = false) => {
    if (!messagesEndRef.current || (!shouldAutoScroll && !force)) return;
    
    try {
      // Detectar si es móvil
      const isMobile = window.innerWidth < 768;
      const scrollContainer = messagesEndRef.current.parentElement;
      
      if (isMobile && force) {
        // En móvil, cuando se fuerza el scroll (al enviar mensaje), hacerlo instantáneo
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      } else {
        // Comportamiento normal para otros casos
        messagesEndRef.current.scrollIntoView({
          behavior: 'instant',
          block: 'end'
        });
      }
    } catch (error) {
      console.error('Error al hacer scroll:', error);
    }
  }, [shouldAutoScroll]);

  // Manejador de scroll para detectar si el usuario está en el fondo
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 50;
    setShouldAutoScroll(isAtBottom);
  }, []);

  // Efecto para manejar el scroll inicial y cuando llegan nuevos mensajes
  useEffect(() => {
    // Solo hacer scroll automático si el usuario está en la parte inferior
    if (messages.length > 0 && shouldAutoScroll) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom, shouldAutoScroll]);

  const updateStatusMessage = useCallback((message: string) => {
    setStatusMessage(message);
    setLastStatusMessage({
      userId: 'status',
      username: '',
      message: message,
      timestamp: new Date(),
      isStatus: true
    });
  }, []);

  const loadMessages = useCallback(async () => {
    try {
      const response = await fetch('/api/irc/message');
      if (!response.ok) {
        throw new Error('Error cargando mensajes');
      }
      const data = await response.json();
      const newMessages = data.messages?.map((msg: Message) => ({
        ...msg,
        isStatus: msg.userId === 'system',
        id: `${msg.timestamp}-${msg.userId}-${msg.message}`
      })) || [];

      // Solo actualizar si hay mensajes nuevos
      setMessages(prevMessages => {
        const prevIds = new Set(prevMessages.map(m => m.id));
        const hasNewMessages = newMessages.some((msg: Message) => !prevIds.has(msg.id));
        return hasNewMessages ? newMessages : prevMessages;
      });
    } catch (error) {
      console.error('Error loading messages:', error);
      setStatusMessage('Error cargando mensajes');
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/irc/users');
      if (!response.ok) {
        throw new Error('Error cargando usuarios');
      }
      const data = await response.json();
      setConnectedUsers(data.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }, []);

  const checkConnection = useCallback(async () => {
    try {
      if (isReconnecting) return; // Evitar múltiples intentos de reconexión
      
      const response = await fetch('/api/irc/status');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error('Error de conexión');
      }

      const wasDisconnected = !isConnected && data.isConnected;
      setIsConnected(data.isConnected);
      
      if (data.isConnected) {
        if (wasDisconnected) {
          updateStatusMessage('Conectado a IRC');
        }
        await loadMessages();
        await loadUsers();
      } else {
        updateStatusMessage('Desconectado - Usa /join {inviteCode} para unirte');
      }
    } catch (error) {
      console.error('Error checking connection:', error);
      updateStatusMessage('Error de conexión - Intenta de nuevo');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
      setIsReconnecting(false);
    }
  }, [loadMessages, loadUsers, updateStatusMessage, isConnected, isReconnecting]);

  useEffect(() => {
    checkConnection();

    // Verificar conexión cada 2 minutos en lugar de cada 30 segundos
    const intervalId = setInterval(checkConnection, 120000);
    return () => clearInterval(intervalId);
  }, [checkConnection]);

  useEffect(() => {
    if (isConnected) {
      // Intervalo principal para cargar mensajes cada 3 segundos
      const messageInterval = setInterval(() => {
        if (!isReconnecting) {
          loadMessages();
        }
      }, 3000);

      // Heartbeat cada 30 segundos para mantener la conexión activa
      const heartbeatInterval = setInterval(() => {
        if (!isReconnecting) {
          loadUsers();
        }
      }, 30000);

      return () => {
        clearInterval(messageInterval);
        clearInterval(heartbeatInterval);
      };
    }
  }, [isConnected, isReconnecting, loadMessages, loadUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;

    if (input.startsWith('/join')) {
      const inviteCode = input.split(' ')[1];
      if (inviteCode === 'snEiopv0055') {
        try {
          updateStatusMessage('Uniéndose al IRC...');
          await new Promise(resolve => setTimeout(resolve, 800));
          
          const response = await fetch('/api/irc/join', {
            method: 'POST',
          });
          
          if (response.ok) {
            setIsConnected(true);
            await new Promise(resolve => setTimeout(resolve, 500));
            updateStatusMessage('Te has unido al IRC');
            loadMessages();
            loadUsers();
            setInput('');
            // Forzar scroll solo al unirse
            setShouldAutoScroll(true);
            scrollToBottom(true);
            return;
          } else {
            setError('Error al unirse al IRC');
            updateStatusMessage('Error al unirse al IRC');
          }
        } catch (error) {
          setError('Error de conexión');
          updateStatusMessage('Error de conexión');
        }
      } else {
        setError('Código de invitación inválido');
      }
      return;
    }

    if (!isConnected) {
      setError('Debes unirte al IRC primero con /join snEiopv0055');
      return;
    }

    const messageText = input;
    // Crear el mensaje optimista
    const optimisticMessage: Message = {
      userId: session?.user?.id || '',
      username: session?.user?.name || '',
      message: messageText,
      timestamp: new Date(),
      id: `optimistic-${Date.now()}`,
      userColor: connectedUsers.find(u => u.userId === session?.user?.id)?.userColor,
      isOptimistic: true
    };

    // Añadir el mensaje optimista inmediatamente
    setMessages(prev => [...prev, optimisticMessage]);
    setInput('');
    // Forzar scroll al enviar mensaje
    setShouldAutoScroll(true);
    scrollToBottom(true);

    try {
      const response = await fetch('/api/irc/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageText }),
      });

      if (!response.ok) {
        // Si hay error, remover el mensaje optimista
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
        throw new Error('Error al enviar mensaje');
      }

      // Cargar los mensajes actualizados del servidor
      await loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      setStatusMessage('Error enviando mensaje');
      setError('Error al enviar el mensaje');
    }
  };

  const handleLeave = async () => {
    try {
      await fetch('/api/irc/leave', {
        method: 'POST',
      });
      setIsConnected(false);
      setMessages([]);
      setConnectedUsers([]);
      updateStatusMessage('Has salido del IRC');
    } catch (error) {
      console.error('Error leaving IRC:', error);
      updateStatusMessage('Error al salir del IRC');
    }
  };

  const allMessages = lastStatusMessage 
    ? [...messages, lastStatusMessage].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
    : messages;

  return (
    <div className="h-[calc(100vh-4rem)] bg-black font-mono text-sm md:text-base">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-black p-2 md:p-3 flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center gap-2 md:gap-4">
            <span className="text-green-500 text-xs md:text-sm">irc.colo-solutions.net</span>
            <div className="flex items-center gap-1 md:gap-2 text-gray-500 text-xs md:text-sm">
              <span>usuarios: {connectedUsers.length}</span>
            </div>
          </div>
          {isConnected && (
            <button
              onClick={handleLeave}
              className="text-gray-500 hover:text-red-500"
              title="Salir del IRC"
            >
              /quit
            </button>
          )}
        </div>

        {/* Área de mensajes */}
        <div 
          className="flex-1 overflow-y-auto p-2 md:p-4 space-y-1 min-h-0 mb-16 md:mb-0 bg-black"
          onScroll={handleScroll}
        >
          {allMessages.map((msg, index) => (
            <motion.div
              key={msg.id || `${msg.timestamp}-${index}`}
              initial={msg.isOptimistic ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className={msg.isStatus ? "text-gray-500 text-xs" : "flex flex-col gap-0.5"}
            >
              {!msg.isStatus ? (
                <>
                  <div className="flex text-gray-300 min-w-0">
                    <div className="flex gap-1 flex-shrink-0">
                      <span className="text-gray-600">[</span>
                      <span className="text-gray-500">{new Date(msg.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-gray-600">]</span>
                    </div>
                    <div className="flex flex-col ml-1 min-w-0 flex-1">
                      <span style={{ color: msg.userColor }} className="flex-shrink-0">
                        &lt;{msg.username}&gt;
                      </span>
                      <span className="text-gray-300 break-all overflow-hidden">{msg.message}</span>
                    </div>
                  </div>
                </>
              ) : (
                <span className="text-gray-500">* {msg.message}</span>
              )}
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input */}
        <div className="mt-auto fixed md:relative bottom-0 left-0 right-0 bg-black md:bg-transparent w-full z-10 border-t border-gray-800">
          <form onSubmit={handleSubmit} className="p-2 md:p-3">
            {error && (
              <div className="text-red-500 text-xs mb-1">{error}</div>
            )}
            <div className="flex gap-1">
              <span className="text-green-500">&gt;</span>
              <input
                type="search"
                enterKeyHint="send"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isConnected ? "escribe un mensaje..." : "usa /join snEiopv0055 para unirte"}
                className="flex-1 bg-transparent text-gray-300 py-0 border-none 
                  focus:outline-none appearance-none placeholder-gray-700 text-sm"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 