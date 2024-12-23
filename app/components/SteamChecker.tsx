'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlay, 
  FiTrash2, 
  FiCopy, 
  FiCheck, 
  FiX, 
  FiAlertCircle,
  FiSettings,
  FiGlobe,
  FiRefreshCw,
  FiDownload
} from 'react-icons/fi';
import { encrypt, decrypt } from '../utils/encryption';

interface CheckResult {
  account: string;
  success: boolean;
  error?: string;
  details?: {
    username: string;
    password: string;
    status: string;
    balance: string;
    games?: {
      list: string[];
      total: number;
    };
  };
}

interface ChunkInfo {
  chunkIndex: number;
  totalChunks: number;
  accountsInChunk: number;
  totalAccounts: number;
  startIndex: number;
  endIndex: number;
}

interface ProxyConfig {
  enabled: boolean;
  list: string[];
  current: number;
}

declare global {
  interface Window {
    steamCheckerEventSource?: EventSource;
  }
}

export default function SteamChecker() {
  const [accountsInput, setAccountsInput] = useState<string>('');
  const [results, setResults] = useState<CheckResult[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState({ checked: 0, total: 0, currentChunk: 0, totalChunks: 0 });
  const [showSettings, setShowSettings] = useState(false);
  const [proxyConfig, setProxyConfig] = useState<ProxyConfig>({
    enabled: false,
    list: [],
    current: 0
  });
  const [proxyInput, setProxyInput] = useState('');
  const [copiedAll, setCopiedAll] = useState(false);

  useEffect(() => {
    return () => {
      if (window.steamCheckerEventSource) {
        window.steamCheckerEventSource.close();
      }
    };
  }, []);

  const handleProxySave = () => {
    const proxies = proxyInput
      .split('\n')
      .map(p => p.trim())
      .filter(Boolean);
    setProxyConfig(prev => ({
      ...prev,
      list: proxies
    }));
    setShowSettings(false);
  };

  const processChunk = async (accounts: string[], chunkInfo: ChunkInfo) => {
    try {
      const dataToEncrypt = JSON.stringify({
        accounts,
        chunk: chunkInfo.chunkIndex
      });
      const encryptedData = encrypt(dataToEncrypt);

      const response = await fetch('/api/steam/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: encryptedData
      });

      if (!response.ok) throw new Error('Error al procesar el chunk');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No se pudo iniciar la lectura de la respuesta');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const encryptedResult = line.slice(6);
              const decryptedResult = decrypt(encryptedResult);
              const data = JSON.parse(decryptedResult);
              
              if (data.result) {
                if (data.result.account === 'system') {
                  console.log('Mensaje del sistema:', data.result.error);
                } else {
                  setResults(prev => [...prev, data.result]);
                  setProgress(prev => ({ 
                    ...prev, 
                    checked: prev.checked + 1 
                  }));
                }
              }
            } catch (e) {
              console.error('Error procesando resultado:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error procesando chunk ${chunkInfo.chunkIndex}:`, error);
      throw error;
    }
  };

  const checkAccounts = async () => {
    if (!accountsInput.trim()) {
      setError('Por favor, ingresa al menos una cuenta para verificar');
      return;
    }

    if (proxyConfig.enabled && proxyConfig.list.length === 0) {
      setError('Por favor, configura al menos un proxy o desactiva el uso de proxies');
      return;
    }

    setIsChecking(true);
    setResults([]);
    setError(null);

    const accountsList = accountsInput
      .split('\n')
      .map((account: string) => account.trim())
      .filter((account: string) => account && account.includes(':'));

    if (accountsList.length === 0) {
      setError('No se encontraron cuentas válidas para verificar');
      setIsChecking(false);
      return;
    }

    try {
      // Primera solicitud para obtener información de chunks
      const initialData = encrypt(JSON.stringify(accountsList));
      const initialResponse = await fetch('/api/steam/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: initialData
      });

      if (!initialResponse.ok) throw new Error('Error al iniciar la verificación');

      const encryptedChunkInfo = await initialResponse.text();
      const decryptedChunkInfo = decrypt(encryptedChunkInfo);
      const { chunks, message } = JSON.parse(decryptedChunkInfo);

      console.log('Información de chunks:', message);
      setProgress({ 
        checked: 0, 
        total: accountsList.length,
        currentChunk: 0,
        totalChunks: chunks.length
      });

      // Procesar cada chunk secuencialmente
      for (const chunkInfo of chunks) {
        setProgress(prev => ({ ...prev, currentChunk: chunkInfo.chunkIndex + 1 }));
        
        const chunkAccounts = accountsList.slice(chunkInfo.startIndex, chunkInfo.endIndex);
        await processChunk(chunkAccounts, chunkInfo);
        
        // Pequeña pausa entre chunks
        if (chunkInfo.chunkIndex < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (err) {
      setError('Error al verificar las cuentas. Por favor, intenta nuevamente.');
      console.error('Error:', err);
    } finally {
      setIsChecking(false);
    }
  };

  const copyToClipboard = async (result: CheckResult, index: number) => {
    try {
      let textToCopy = '';
      if (result.details) {
        const { username, password, status, balance } = result.details;
        const games = result.details.games?.list || [];
        const gamesText = games.length > 0 ? 
          `|Games(${result.details.games?.total}): ${games.join(', ')}` : 
          '|Games: 0';
        textToCopy = `${username}:${password}|${status}|${balance}${gamesText}`;
      } else {
        textToCopy = result.account;
      }

      await navigator.clipboard.writeText(textToCopy);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const copyHits = async () => {
    try {
      const hits = results
        .filter(result => result.success)
        .map(result => {
          if (result.details) {
            const { username, password, status, balance } = result.details;
            const games = result.details.games?.list || [];
            const gamesText = games.length > 0 ? 
              `|Games(${result.details.games?.total}): ${games.join(', ')}` : 
              '|Games: 0';
            return `${username}:${password}|${status}|${balance}${gamesText}`;
          }
          return result.account;
        })
        .join('\n');

      await navigator.clipboard.writeText(hits);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) {
      console.error('Error al copiar hits:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/50 p-6 rounded-2xl border border-gray-800 backdrop-blur-sm shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FiDownload className="text-yellow-400" />
            Steam Checker
          </h2>
          <div className="flex items-center gap-4">
            {isChecking && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-4 py-1 bg-yellow-400/10 rounded-full"
              >
                <span className="text-sm text-yellow-400 font-medium">
                  {progress.checked}/{progress.total} - Chunk {progress.currentChunk}/{progress.totalChunks}
                </span>
              </motion.div>
            )}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${
                showSettings ? 'bg-yellow-400 text-black' : 'bg-yellow-400/10 text-yellow-400'
              }`}
            >
              <FiSettings className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Configuración de Proxies */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 space-y-4 overflow-hidden"
            >
              <div className="flex items-center justify-between bg-yellow-400/5 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <FiGlobe className="text-yellow-400" />
                  <span className="text-gray-400">Usar Proxies</span>
                </div>
                <button
                  onClick={() => setProxyConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    proxyConfig.enabled ? 'bg-yellow-400' : 'bg-gray-600'
                  }`}
                >
                  <motion.div
                    animate={{ x: proxyConfig.enabled ? 24 : 2 }}
                    className="w-5 h-5 bg-white rounded-full"
                  />
                </button>
              </div>

              {proxyConfig.enabled && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-400">Lista de Proxies</label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {proxyConfig.list.length} proxies configurados
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleProxySave}
                        className="p-1.5 bg-yellow-400/10 text-yellow-400 rounded-lg 
                          hover:bg-yellow-400/20 transition-colors"
                      >
                        <FiRefreshCw className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                  <textarea
                    value={proxyInput}
                    onChange={(e) => setProxyInput(e.target.value)}
                    placeholder="Ingresa los proxies (uno por línea)&#10;Formato: ip:puerto:usuario:contraseña"
                    className="w-full h-32 bg-black/40 text-white rounded-lg p-4 border border-gray-700 
                      focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 focus:outline-none 
                      transition-all duration-300 backdrop-blur-sm resize-none font-mono text-sm"
                  />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input de Cuentas */}
        <textarea
          value={accountsInput}
          onChange={(e) => setAccountsInput(e.target.value)}
          placeholder="Ingresa las cuentas (una por línea)&#10;Formato: usuario:contraseña&#10;Ejemplo: usuario1:contraseña1"
          className="w-full h-40 bg-black/40 text-white rounded-lg p-4 mb-4 border border-gray-700 
            focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 focus:outline-none 
            transition-all duration-300 backdrop-blur-sm resize-none font-mono text-sm"
          disabled={isChecking}
        />

        {/* Mensajes de Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg 
                text-red-400 text-sm flex items-center gap-2"
            >
              <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botón de Verificación */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={checkAccounts}
          disabled={isChecking}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all 
            flex items-center justify-center gap-2 ${
              isChecking
                ? 'bg-gray-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:opacity-90'
            }`}
        >
          <FiPlay className={`w-4 h-4 ${isChecking ? 'animate-pulse' : ''}`} />
          {isChecking ? 'Verificando...' : 'Verificar Cuentas'}
        </motion.button>

        {/* Resultados */}
        <AnimatePresence>
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-6 space-y-4"
            >
              {/* Estadísticas y Botón de Copiar */}
              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  <span className="text-green-400">
                    Hits: {results.filter(r => r.success).length}
                  </span>
                  <span className="text-red-400">
                    Fails: {results.filter(r => !r.success).length}
                  </span>
                </div>
                {results.some(r => r.success) && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={copyHits}
                    className="px-4 py-2 bg-green-500/10 text-green-400 rounded-lg 
                      hover:bg-green-500/20 transition-colors flex items-center gap-2"
                  >
                    {copiedAll ? (
                      <>
                        <FiCheck className="w-4 h-4" />
                        Hits Copiados
                      </>
                    ) : (
                      <>
                        <FiCopy className="w-4 h-4" />
                        Copiar Hits
                      </>
                    )}
                  </motion.button>
                )}
              </div>

              {/* Lista de Resultados */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((result, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`relative p-4 rounded-xl border backdrop-blur-sm ${
                      result.success
                        ? 'bg-black/50 border-green-500/20'
                        : 'bg-black/50 border-red-500/20'
                    } shadow-lg group`}
                  >
                    {/* Contenido de la Cuenta */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm text-gray-400">
                          {result.account}
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => copyToClipboard(result, index)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          {copiedIndex === index ? (
                            <FiCheck className="w-4 h-4 text-green-400" />
                          ) : (
                            <FiCopy className="w-4 h-4" />
                          )}
                        </motion.button>
                      </div>

                      {/* Detalles de la Cuenta */}
                      <div className={`text-sm ${
                        result.success ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {result.success ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <FiCheck className="w-4 h-4" />
                              {result.details?.status === '2FA_REQUIRED' ? (
                                <span>2FA Required</span>
                              ) : (
                                <div className="space-y-2 w-full">
                                  <div className="flex items-center justify-between">
                                    <span>Status: {result.details?.status}</span>
                                    <span>Balance: {result.details?.balance}</span>
                                  </div>
                                  {result.details?.games && result.details.games.total > 0 && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      className="mt-2 p-2 bg-black/40 rounded-lg"
                                    >
                                      <div className="text-gray-400 mb-1">
                                        Games ({result.details.games.total}):
                                      </div>
                                      <div className="text-sm text-gray-300 max-h-20 overflow-y-auto">
                                        {result.details.games.list.join(', ')}
                                      </div>
                                    </motion.div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <FiX className="w-4 h-4" />
                            <span>{result.error || 'Cuenta inválida'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
