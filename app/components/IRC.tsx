'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { FiMessageSquare, FiUsers, FiLogOut } from 'react-icons/fi';

interface Message {
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
  isStatus?: boolean;
}

interface IrcUser {
  userId: string;
  username: string;
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
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Cargando IRC...');
  const [lastStatusMessage, setLastStatusMessage] = useState<Message | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, statusMessage]);

  const updateStatusMessage = (message: string) => {
    setStatusMessage(message);
    setLastStatusMessage({
      userId: 'status',
      username: '',
      message: message,
      timestamp: new Date(),
      isStatus: true
    });
  };

  useEffect(() => {
    const checkConnection = async () => {
      try {
        setIsReconnecting(true);
        updateStatusMessage('Conectando a IRC...');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const response = await fetch('/api/irc/status');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error('Error de conexión');
        }

        setIsConnected(data.isConnected);
        if (data.isConnected) {
          await new Promise(resolve => setTimeout(resolve, 800));
          updateStatusMessage('Conectado a IRC');
          await loadMessages();
          await loadUsers();
        } else {
          updateStatusMessage('No conectado - Usa /join snEiopv0055 para unirte');
        }
      } catch (error) {
        console.error('Error checking connection:', error);
        updateStatusMessage('Error de conexión - Intenta de nuevo');
        setIsConnected(false);
      } finally {
        setIsLoading(false);
        setIsReconnecting(false);
      }
    };

    checkConnection();

    // Verificar conexión cada 30 segundos
    const intervalId = setInterval(checkConnection, 30000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        if (!isReconnecting) {
          loadMessages();
          loadUsers();
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isConnected, isReconnecting]);

  const loadMessages = async () => {
    try {
      const response = await fetch('/api/irc/message');
      if (!response.ok) {
        throw new Error('Error cargando mensajes');
      }
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      setStatusMessage('Error cargando mensajes');
    }
  };

  const loadUsers = async () => {
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
  };

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
            return;
          } else {
            setError('Error al unirse al canal');
            updateStatusMessage('Error al unirse al canal');
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
      setError('Debes unirte al canal primero con /join {inviteCode}');
      return;
    }

    try {
      const response = await fetch('/api/irc/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });

      if (response.ok) {
        setInput('');
        loadMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setStatusMessage('Error enviando mensaje');
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
      updateStatusMessage('Has salido del canal');
    } catch (error) {
      console.error('Error leaving channel:', error);
      updateStatusMessage('Error al salir del canal');
    }
  };

  const allMessages = lastStatusMessage 
    ? [...messages, lastStatusMessage].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
    : messages;

  return (
    <div className="h-[calc(100vh-4rem)] bg-black/50">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-black/30 p-4 flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-yellow-400">energy-tools</h2>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <FiUsers className="w-4 h-4" />
              <span>usuarios: {connectedUsers.length}</span>
            </div>
          </div>
          {isConnected && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleLeave}
              className="p-2 text-gray-400 hover:text-red-400 transition-colors"
              title="Salir del canal"
            >
              <FiLogOut className="w-5 h-5" />
            </motion.button>
          )}
        </div>

        {/* Área de mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          <AnimatePresence>
            {allMessages.map((msg, index) => (
              <motion.div
                key={`msg-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={msg.isStatus ? "text-white/70 text-sm italic" : "flex items-start gap-2"}
              >
                {!msg.isStatus ? (
                  <>
                    <span className="text-yellow-400 font-medium">{msg.username}:</span>
                    <span className="text-gray-300">{msg.message}</span>
                  </>
                ) : (
                  msg.message
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="mt-auto">
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800 bg-black/30">
            {error && (
              <div className="text-red-400 text-sm mb-2">{error}</div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isConnected ? "Escribe un mensaje..." : "Usa /join snEiopv0055 para unirte"}
                className="flex-1 bg-black/40 text-white rounded-lg px-4 py-2 border border-gray-700 
                  focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 focus:outline-none"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="p-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 transition-colors"
              >
                <FiMessageSquare className="w-5 h-5" />
              </motion.button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 