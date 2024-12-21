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
  FiDownload,
  FiSettings,
  FiGlobe,
  FiRefreshCw,
  FiMonitor
} from 'react-icons/fi';
import { encrypt, decrypt } from '../utils/encryption';

interface AccountResult {
  account: string;
  success: boolean;
  error?: string;
  details?: {
    subscription?: string;
    subType?: string;
    description?: string;
    expireDate?: string;
    nextRenewalDate?: string;
    freeTrial?: string;
    lastConnection?: string;
    voucherCode?: string;
    earlyAccess?: string;
    emailVerified?: boolean;
    securityFlagged?: boolean;
    country?: string;
    maxProfiles?: number;
    userVerified?: boolean;
    email?: string;
    createdAt?: string;
  };
}

interface ProxyConfig {
  enabled: boolean;
  list: string[];
  current: number;
}

declare global {
  interface Window {
    disneyCheckerEventSource?: EventSource;
  }
}

export default function DisneyChecker() {
  const [accountsInput, setAccountsInput] = useState<string>('');
  const [results, setResults] = useState<AccountResult[]>([]);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [totalChecked, setTotalChecked] = useState<number>(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
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
      if (window.disneyCheckerEventSource) {
        window.disneyCheckerEventSource.close();
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

    const accounts = accountsInput
      .split('\n')
      .map(account => account.trim())
      .filter(account => account && account.includes(':'));

    if (accounts.length === 0) {
      setError('No se encontraron cuentas válidas para verificar');
      setIsChecking(false);
      return;
    }

    setProgress({ checked: 0, total: accounts.length });

    try {
      if (window.disneyCheckerEventSource) {
        window.disneyCheckerEventSource.close();
      }

      const dataToEncrypt = JSON.stringify(accounts);
      console.log('📦 Datos a encriptar:', dataToEncrypt);
      
      let encryptedData: string;
      try {
        encryptedData = encrypt(dataToEncrypt);
        console.log('🔒 Datos encriptados:', encryptedData);
      } catch (encryptError) {
        console.error('❌ Error al encriptar:', encryptError);
        throw new Error('Error al encriptar los datos');
      }

      const response = await fetch('/api/disney/check', {
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

  const copyHits = async () => {
    try {
      const hits = results
        .filter(result => result.success)
        .map(result => {
          if (result.details) {
            const { subscription, subType, expireDate, country } = result.details;
            return `${result.account}|${subscription || 'N/A'}|${subType || 'N/A'}|${expireDate || 'N/A'}|${country || 'N/A'}`;
          }
          return result.account;
        })
        .join('\n');

      if (hits) {
        await navigator.clipboard.writeText(hits);
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 2000);
      }
    } catch (err) {
      setError('Error al copiar los hits');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const liveCount = results.filter(r => r.success).length;
  const twoFACount = results.filter(r => r.error === '2FA activo').length;

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
            <FiPlay className="text-yellow-400" />
            Disney+ Checker
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
          placeholder="Ingresa las cuentas&#10;Formato: email:password&#10;Ejemplo: usuario@email.com:contraseña123"
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

        {/* Botones de Acción */}
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={checkAccounts}
            disabled={isChecking}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all 
              flex items-center justify-center gap-2 ${
              isChecking
                ? 'bg-gray-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:opacity-90'
            }`}
          >
            <FiPlay className={`w-4 h-4 ${isChecking ? 'animate-pulse' : ''}`} />
            {isChecking ? 'Verificando...' : 'Verificar Cuentas'}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setAccountsInput('');
              setResults([]);
              setError(null);
              setProgress({ checked: 0, total: 0 });
            }}
            className="p-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 
              transition-colors"
          >
            <FiTrash2 className="w-5 h-5" />
          </motion.button>
        </div>

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
                    Hits: {liveCount}
                  </span>
                  <span className="text-yellow-400">
                    2FA: {twoFACount}
                  </span>
                  <span className="text-red-400">
                    Fails: {results.length - liveCount - twoFACount}
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
                        <FiDownload className="w-4 h-4" />
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
                        : result.error === '2FA activo'
                        ? 'bg-black/50 border-yellow-500/20'
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

                      {/* Detalles de la Cuenta */}
                      <div className={`text-sm ${
                        result.success 
                          ? 'text-green-400' 
                          : result.error === '2FA activo'
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}>
                        {result.success ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <FiCheck className="w-4 h-4" />
                              <span>Cuenta válida</span>
                            </div>
                            {result.details && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-2 p-3 bg-black/40 rounded-lg text-gray-300 space-y-1.5"
                              >
                                <div className="grid grid-cols-2 gap-2">
                                  <p>
                                    <span className="text-gray-500">Suscripción:</span>
                                    <br />
                                    {result.details.subscription || 'N/A'}
                                  </p>
                                  <p>
                                    <span className="text-gray-500">Tipo:</span>
                                    <br />
                                    {result.details.subType || 'N/A'}
                                  </p>
                                  <p>
                                    <span className="text-gray-500">País:</span>
                                    <br />
                                    {result.details.country || 'N/A'}
                                  </p>
                                  <p>
                                    <span className="text-gray-500">Perfiles:</span>
                                    <br />
                                    {result.details.maxProfiles || 'N/A'}
                                  </p>
                                </div>
                                <div className="pt-2 border-t border-gray-700">
                                  <p>
                                    <span className="text-gray-500">Vence:</span>
                                    <br />
                                    {formatDate(result.details.expireDate)}
                                  </p>
                                  <p>
                                    <span className="text-gray-500">Próxima renovación:</span>
                                    <br />
                                    {formatDate(result.details.nextRenewalDate)}
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-700">
                                  <span className={`px-2 py-0.5 rounded text-xs ${
                                    result.details.emailVerified 
                                      ? 'bg-green-500/20 text-green-400'
                                      : 'bg-red-500/20 text-red-400'
                                  }`}>
                                    {result.details.emailVerified ? 'Email Verificado' : 'Email No Verificado'}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded text-xs ${
                                    !result.details.securityFlagged
                                      ? 'bg-green-500/20 text-green-400'
                                      : 'bg-red-500/20 text-red-400'
                                  }`}>
                                    {!result.details.securityFlagged ? 'Cuenta Segura' : 'Cuenta Marcada'}
                                  </span>
                                  {result.details.freeTrial && (
                                    <span className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400">
                                      Prueba Gratuita
                                    </span>
                                  )}
                                </div>
                              </motion.div>
                            )}
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
