'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiZap, FiCheck, FiX, FiAlertCircle, FiCopy, FiSettings, FiGlobe, FiRefreshCw } from 'react-icons/fi';
import { encrypt, decrypt } from '../utils/encryption';

interface CheckResult {
  account: string;
  success: boolean;
  error?: string;
}

interface ProxyConfig {
  enabled: boolean;
  list: string[];
  current: number;
}

declare global {
  interface Window {
    fanslyCheckerEventSource?: EventSource;
  }
}

export default function FanslyChecker() {
  const [accounts, setAccounts] = useState('');
  const [results, setResults] = useState<CheckResult[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState({ checked: 0, total: 0 });
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
      if (window.fanslyCheckerEventSource) {
        window.fanslyCheckerEventSource.close();
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
  };

  const checkAccounts = async () => {
    if (!accounts.trim()) {
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

    const accountList = accounts
      .split('\n')
      .map(account => account.trim())
      .filter(account => account && account.includes(':'));

    if (accountList.length === 0) {
      setError('No se encontraron cuentas válidas para verificar');
      setIsChecking(false);
      return;
    }

    setProgress({ checked: 0, total: accountList.length });

    try {
      const dataToEncrypt = JSON.stringify(accountList);
      console.log('📦 Datos a encriptar:', dataToEncrypt);
      
      let encryptedData: string;
      try {
        encryptedData = encrypt(dataToEncrypt);
        console.log('🔒 Datos encriptados:', encryptedData);
      } catch (encryptError) {
        console.error('❌ Error al encriptar:', encryptError);
        throw new Error('Error al encriptar los datos');
      }

      const response = await fetch('/api/fansly/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: encryptedData
      });

      if (!response.ok) throw new Error('Error al procesar la solicitud');

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
              console.log('📦 Resultado encriptado recibido:', encryptedResult);
              
              const decryptedResult = decrypt(encryptedResult);
              console.log('🔓 Resultado desencriptado:', decryptedResult);
              
              const data = JSON.parse(decryptedResult);
              if (data.result) {
                setResults(prev => [...prev, data.result]);
                setProgress(prev => ({ ...prev, checked: prev.checked + 1 }));
              }
            } catch (e) {
              console.error('Error procesando resultado:', e);
            }
          }
        }
      }
    } catch (err) {
      setError('Error al verificar las cuentas. Por favor, intenta nuevamente.');
    } finally {
      setIsChecking(false);
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const copyAllToClipboard = async () => {
    if (results.length === 0) return;

    try {
      const validAccounts = results
        .filter(result => result.success)
        .map(result => result.account)
        .join('\n');

      await navigator.clipboard.writeText(validAccounts);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) {
      setError('Error al copiar las cuentas');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/50 p-6 rounded-2xl border border-gray-800 backdrop-blur-sm shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FiZap className="text-yellow-400" />
            Fansly Checker
          </h2>
          <div className="flex items-center gap-4">
            {isChecking && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-4 py-1 bg-yellow-400/10 rounded-full"
              >
                <span className="text-sm text-yellow-400 font-medium">
                  {progress.checked}/{progress.total}
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

        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 space-y-4"
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
                <div className="space-y-2">
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
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <textarea
          value={accounts}
          onChange={(e) => setAccounts(e.target.value)}
          placeholder="Ingresa las cuentas (una por línea)&#10;Formato: usuario:contraseña&#10;Ejemplo: usuario1:contraseña1"
          className="w-full h-40 bg-black/40 text-white rounded-lg p-4 mb-4 border border-gray-700 
            focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 focus:outline-none 
            transition-all duration-300 backdrop-blur-sm resize-none font-mono text-sm"
          disabled={isChecking}
        />

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg 
              text-red-400 text-sm flex items-center gap-2"
          >
            <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </motion.div>
        )}

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
          <FiZap className={`w-4 h-4 ${isChecking ? 'animate-pulse' : ''}`} />
          {isChecking ? 'Verificando...' : 'Verificar Cuentas'}
        </motion.button>

        <AnimatePresence>
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                  <span className="text-gray-400">
                    Válidas: {results.filter(r => r.success).length}
                  </span>
                  <span className="text-gray-400">
                    Inválidas: {results.filter(r => !r.success).length}
                  </span>
                </div>
                {results.some(r => r.success) && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={copyAllToClipboard}
                    className="px-4 py-2 bg-yellow-400/10 text-yellow-400 rounded-lg 
                      hover:bg-yellow-400/20 transition-colors flex items-center gap-2"
                  >
                    {copiedAll ? (
                      <>
                        <FiCheck className="w-4 h-4" />
                        Copiadas
                      </>
                    ) : (
                      <>
                        <FiCopy className="w-4 h-4" />
                        Copiar Válidas
                      </>
                    )}
                  </motion.button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((result, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-xl border backdrop-blur-sm ${
                      result.success
                        ? 'bg-black/50 border-green-500/20 shadow-green-500/5'
                        : 'bg-black/50 border-red-500/20 shadow-red-500/5'
                    } shadow-lg`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm text-gray-400">
                        {result.account}
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => copyToClipboard(result.account, index)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {copiedIndex === index ? (
                          <FiCheck className="w-4 h-4 text-green-400" />
                        ) : (
                          <FiCopy className="w-4 h-4" />
                        )}
                      </motion.button>
                    </div>
                    <div className={`text-sm ${
                      result.success ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {result.success ? (
                        <div className="flex items-center gap-2">
                          <FiCheck className="w-4 h-4" />
                          <span>Cuenta válida</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <FiX className="w-4 h-4" />
                          <span>{result.error || 'Cuenta inválida'}</span>
                        </div>
                      )}
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
