'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiGift, FiCheck, FiX, FiAlertCircle, FiCopy, FiSettings, FiGlobe, FiRefreshCw } from 'react-icons/fi';
import { encrypt, decrypt } from '../utils/encryption';

interface GiftDetails {
  store_listing: {
    sku: {
      name: string;
    };
  };
  subscription_plan: {
    name: string;
    price: number;
    currency: string;
  };
  uses: number;
  max_uses: number;
  sku_id: string;
  application_id: string;
  redeemed: boolean;
  expires_at: string;
  promotion: {
    inbound_header_text: string;
    inbound_body_text: string;
    inbound_restricted_countries: string[];
    start_date: string;
    end_date: string;
  };
  subscription_trial: {
    id: string;
  };
  batch_id: string;
  subscription_plan_id: string;
  flags: number;
}

interface CheckResult {
  code: string;
  details?: {
    valid: boolean;
    reason?: string;
    giftDetails?: GiftDetails;
  };
}

interface ChunkInfo {
  chunkIndex: number;
  totalChunks: number;
  codesInChunk: number;
  totalCodes: number;
  startIndex: number;
  endIndex: number;
}

interface ProxyConfig {
  enabled: boolean;
  list: string[];
  current: number;
}

interface CopyFormat {
  type: 'code' | 'url';
  label: string;
}

declare global {
  interface Window {
    discordCheckerEventSource?: EventSource;
  }
}

export default function DiscordChecker() {
  const [codes, setCodes] = useState('');
  const [results, setResults] = useState<CheckResult[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState({ 
    checked: 0, 
    total: 0,
    currentChunk: 0,
    totalChunks: 0
  });
  const [showSettings, setShowSettings] = useState(false);
  const [proxyConfig, setProxyConfig] = useState<ProxyConfig>({
    enabled: false,
    list: [],
    current: 0
  });
  const [proxyInput, setProxyInput] = useState('');
  const [copiedAll, setCopiedAll] = useState(false);
  const [copyFormat, setCopyFormat] = useState<CopyFormat>({ type: 'code', label: 'Código' });

  useEffect(() => {
    return () => {
      if (window.discordCheckerEventSource) {
        window.discordCheckerEventSource.close();
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

  const processChunk = async (codes: string[], chunkInfo: ChunkInfo) => {
    try {
      const dataToEncrypt = JSON.stringify({
        codes,
        chunk: chunkInfo.chunkIndex
      });
      const encryptedData = encrypt(dataToEncrypt);

      const response = await fetch('/api/discord/check', {
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
                if (data.result.code === 'system') {
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

  const extractCode = (input: string): string => {
    // Check if it's a Discord promotion URL
    const urlMatch = input.match(/discord\.com\/billing\/promotions\/([A-Za-z0-9]+)/);
    if (urlMatch) {
      return urlMatch[1];
    }
    return input.trim();
  };

  const checkCodes = async () => {
    if (!codes.trim()) {
      setError('Por favor, ingresa al menos un código para verificar');
      return;
    }

    if (proxyConfig.enabled && proxyConfig.list.length === 0) {
      setError('Por favor, configura al menos un proxy o desactiva el uso de proxies');
      return;
    }

    setIsChecking(true);
    setResults([]);
    setError(null);

    const codeList = codes
      .split('\n')
      .map(code => extractCode(code))
      .filter(Boolean);

    if (codeList.length === 0) {
      setError('No se encontraron códigos válidos para verificar');
      setIsChecking(false);
      return;
    }

    try {
      // Enviar la lista de códigos para obtener información de chunks
      const response = await fetch('/api/discord/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ codes: codeList })
      });

      if (!response.ok) throw new Error('Error al iniciar la verificación');

      const { chunks, message } = await response.json();
      console.log('Información de chunks:', message);
      
      setProgress({ 
        checked: 0, 
        total: codeList.length,
        currentChunk: 0,
        totalChunks: chunks.length
      });

      // Procesar cada chunk secuencialmente
      for (const chunkInfo of chunks) {
        setProgress(prev => ({ ...prev, currentChunk: chunkInfo.chunkIndex + 1 }));
        
        const chunkCodes = codeList.slice(chunkInfo.startIndex, chunkInfo.endIndex);
        
        // Procesar códigos del chunk
        for (const code of chunkCodes) {
          try {
            const codeResponse = await fetch('/api/discord/check', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ codes: code })
            });

            if (!codeResponse.ok) throw new Error('Error al verificar el código');

            const result = await codeResponse.json();
            setResults(prev => [...prev, result]);
            setProgress(prev => ({ ...prev, checked: prev.checked + 1 }));

            // Pequeña pausa entre códigos
            if (chunkInfo.chunkIndex < chunks.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          } catch (error) {
            console.error('Error procesando código:', error);
            setResults(prev => [...prev, {
              code,
              details: {
                valid: false,
                reason: 'Error al procesar el código'
              }
            }]);
            setProgress(prev => ({ ...prev, checked: prev.checked + 1 }));
          }
        }
        
        // Pequeña pausa entre chunks
        if (chunkInfo.chunkIndex < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (err) {
      setError('Error al verificar los c��digos. Por favor, intenta nuevamente.');
      console.error('Error:', err);
    } finally {
      setIsChecking(false);
    }
  };

  const copyToClipboard = async (code: string, index: number) => {
    try {
      const textToCopy = copyFormat.type === 'url' 
        ? `https://discord.com/billing/promotions/${code}`
        : code;
      await navigator.clipboard.writeText(textToCopy);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const copyAllToClipboard = async () => {
    if (results.length === 0) return;

    try {
      const validCodes = results
        .filter(result => result.details?.valid)
        .map(result => copyFormat.type === 'url' 
          ? `https://discord.com/billing/promotions/${result.code}`
          : result.code)
        .join('\n');

      await navigator.clipboard.writeText(validCodes);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) {
      setError('Error al copiar los códigos');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/50 p-6 rounded-2xl border border-yellow-800 backdrop-blur-sm shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FiGift className="text-yellow-400" />
            Discord Promo Checker
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
          value={codes}
          onChange={(e) => setCodes(e.target.value)}
          placeholder="Ingresa los códigos promocionales (uno por línea)&#10;Ejemplos:&#10;Fa9ncvxXnFwYsbp3YKhEfnCN&#10;https://discord.com/billing/promotions/Fa9ncvxXnFwYsbp3YKhEfnCN"
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
          onClick={checkCodes}
          disabled={isChecking}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all 
            flex items-center justify-center gap-2 ${
            isChecking
              ? 'bg-gray-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:opacity-90'
          }`}
        >
          <FiGift className={`w-4 h-4 ${isChecking ? 'animate-pulse' : ''}`} />
          {isChecking ? 'Verificando...' : 'Verificar Códigos'}
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
                    Válidos: {results.filter(r => r.details?.valid).length}
                  </span>
                  <span className="text-gray-400">
                    Inválidos: {results.filter(r => !r.details?.valid).length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={copyFormat.type}
                    onChange={(e) => setCopyFormat({
                      type: e.target.value as 'code' | 'url',
                      label: e.target.value === 'url' ? 'URL' : 'Código'
                    })}
                    className="bg-yellow-400/10 text-yellow-400 rounded-lg px-3 py-2
                      border border-yellow-400/20 focus:outline-none focus:border-yellow-400
                      text-sm hidden sm:block"
                  >
                    <option value="code">Copiar como Código</option>
                    <option value="url">Copiar como URL</option>
                  </select>
                  <select
                    value={copyFormat.type}
                    onChange={(e) => setCopyFormat({
                      type: e.target.value as 'code' | 'url',
                      label: e.target.value === 'url' ? 'URL' : 'Código'
                    })}
                    className="bg-yellow-400/10 text-yellow-400 rounded-lg px-2 py-1.5
                      border border-yellow-400/20 focus:outline-none focus:border-yellow-400
                      text-sm block sm:hidden w-24"
                  >
                    <option value="code">Código</option>
                    <option value="url">URL</option>
                  </select>
                  {results.some(r => r.details?.valid) && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={copyAllToClipboard}
                      className="px-4 py-2 bg-yellow-400/10 text-yellow-400 rounded-lg 
                        hover:bg-yellow-400/20 transition-colors flex items-center gap-2
                        whitespace-nowrap text-sm"
                    >
                      {copiedAll ? (
                        <>
                          <FiCheck className="w-4 h-4" />
                          <span className="hidden sm:inline">Copiados</span>
                          <span className="sm:hidden">OK</span>
                        </>
                      ) : (
                        <>
                          <FiCopy className="w-4 h-4" />
                          <span className="hidden sm:inline">Copiar Válidos</span>
                          <span className="sm:hidden">Copiar</span>
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {results.map((result, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-xl border backdrop-blur-sm ${
                      result.details?.valid
                        ? 'bg-black/50 border-green-500/20 shadow-green-500/5'
                        : 'bg-black/50 border-red-500/20 shadow-red-500/5'
                    } shadow-lg`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm text-gray-400">
                        {result.code}
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => copyToClipboard(result.code, index)}
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
                      result.details?.valid ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {result.details?.valid ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <FiCheck className="w-4 h-4" />
                            <span>Código válido</span>
                          </div>
                          {result.details?.giftDetails && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-2 p-3 bg-black/40 rounded-lg text-gray-300 space-y-1.5"
                            >
                              <div className="grid grid-cols-2 gap-2">
                                <p>
                                  <span className="text-gray-500">Tipo:</span>
                                  <br />
                                  {result.details.giftDetails.store_listing.sku.name}
                                </p>
                                <p>
                                  <span className="text-gray-500">Plan:</span>
                                  <br />
                                  {result.details.giftDetails.subscription_plan.name}
                                </p>
                                <p>
                                  <span className="text-gray-500">Usos:</span>
                                  <br />
                                  {result.details.giftDetails.uses}/{result.details.giftDetails.max_uses}
                                </p>
                                <p>
                                  <span className="text-gray-500">Precio:</span>
                                  <br />
                                  {(result.details.giftDetails.subscription_plan.price / 100).toFixed(2)} 
                                  {result.details.giftDetails.subscription_plan.currency.toUpperCase()}
                                </p>
                              </div>
                              <div className="pt-2 border-t border-gray-700">
                                <p>
                                  <span className="text-gray-500">Estado:</span>
                                  <br />
                                  {result.details.giftDetails.redeemed ? 'Canjeado' : 'No Canjeado'}
                                </p>
                                <p>
                                  <span className="text-gray-500">Expira:</span>
                                  <br />
                                  {new Date(result.details.giftDetails.expires_at).toLocaleString()}
                                </p>
                              </div>
                              <div className="pt-2 border-t border-gray-700">
                                <p>
                                  <span className="text-gray-500">Promoción:</span>
                                  <br />
                                  {result.details.giftDetails.promotion.inbound_header_text}
                                </p>
                                <p className="text-sm text-gray-400">
                                  {result.details.giftDetails.promotion.inbound_body_text}
                                </p>
                              </div>
                              <div className="pt-2 border-t border-gray-700">
                                <span className="text-gray-500">Países Restringidos:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {result.details.giftDetails.promotion.inbound_restricted_countries.map((country: string) => (
                                    <span key={country} className="bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">
                                      {country}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="pt-2 border-t border-gray-700 grid grid-cols-2 gap-2">
                                <div>
                                  <span className="text-gray-500">Inicio Promoción:</span>
                                  <br />
                                  {new Date(result.details.giftDetails.promotion.start_date).toLocaleString()}
                                </div>
                                <div>
                                  <span className="text-gray-500">Fin Promoción:</span>
                                  <br />
                                  {new Date(result.details.giftDetails.promotion.end_date).toLocaleString()}
                                </div>
                              </div>
                              <div className="pt-2 border-t border-gray-700 text-xs font-mono">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <span className="text-gray-500">SKU ID:</span>
                                    <br />
                                    {result.details.giftDetails.sku_id}
                                  </div>
                                  <div>
                                    <span className="text-gray-500">App ID:</span>
                                    <br />
                                    {result.details.giftDetails.application_id}
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Trial ID:</span>
                                    <br />
                                    {result.details.giftDetails.subscription_trial.id}
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Batch ID:</span>
                                    <br />
                                    {result.details.giftDetails.batch_id}
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Plan ID:</span>
                                    <br />
                                    {result.details.giftDetails.subscription_plan_id}
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Flags:</span>
                                    <br />
                                    {result.details.giftDetails.flags}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <FiX className="w-4 h-4" />
                          <span>{result.details?.reason || 'Código inválido'}</span>
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