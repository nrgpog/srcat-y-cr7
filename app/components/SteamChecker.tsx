'use client';

import { useState, useEffect } from 'react';
import { FiZap, FiCheck, FiX, FiAlertCircle, FiCopy } from 'react-icons/fi';

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

export default function SteamChecker() {
  const [accounts, setAccounts] = useState('');
  const [results, setResults] = useState<CheckResult[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState({ checked: 0, total: 0 });

  useEffect(() => {
    // Limpieza del EventSource cuando el componente se desmonta
    return () => {
      if (window.steamCheckerEventSource) {
        window.steamCheckerEventSource.close();
      }
    };
  }, []);

  const handleCheck = async () => {
    if (!accounts.trim()) {
      setError('Por favor, ingresa al menos una cuenta para verificar');
      return;
    }

    setIsChecking(true);
    setResults([]);
    setError(null);

    const accountList = accounts.split('\n')
      .map(acc => acc.trim())
      .filter(Boolean);

    setProgress({ checked: 0, total: accountList.length });

    try {
      // Cerrar el EventSource anterior si existe
      if (window.steamCheckerEventSource) {
        window.steamCheckerEventSource.close();
      }

      const response = await fetch('/api/steam/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accounts: accountList })
      });

      if (!response.ok) {
        throw new Error('Error al procesar la solicitud');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No se pudo iniciar la lectura de la respuesta');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.result) {
                setResults(prev => [...prev, data.result]);
                setProgress(prev => ({ ...prev, checked: prev.checked + 1 }));
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }

      setIsChecking(false);
    } catch (err) {
      setError('Error al verificar las cuentas. Por favor, intenta nuevamente.');
      setIsChecking(false);
    }
  };

  const copyToClipboard = async (result: CheckResult, index: number) => {
    try {
      let textToCopy = '';
      if (result.details) {
        const { username, password, status, balance } = result.details;
        const games = result.details.games?.list || [];
        const gamesText = games.length > 0 ? `|Games(${result.details.games?.total}): ${games.join(', ')}` : '|Games: 0';
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
            const gamesText = games.length > 0 ? `|Games(${result.details.games?.total}): ${games.join(', ')}` : '|Games: 0';
            return `${username}:${password}|${status}|${balance}${gamesText}`;
          }
          return result.account;
        })
        .join('\n');

      await navigator.clipboard.writeText(hits);
      setError('Hits copiados al portapapeles');
      setTimeout(() => setError(null), 2000);
    } catch (err) {
      console.error('Error al copiar hits:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-[#111111] p-6 rounded-2xl border border-[#222222] shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FiZap className="text-yellow-400" />
            Steam Checker
          </h2>
          <div className="flex items-center gap-4">
            {isChecking && (
              <span className="text-sm text-gray-400">
                Verificando: {progress.checked}/{progress.total}
              </span>
            )}
            {results.some(r => r.success) && (
              <button
                onClick={copyHits}
                className="px-3 py-1 bg-green-500/10 text-green-400 rounded-lg text-sm hover:bg-green-500/20 transition-colors"
              >
                Copiar Hits
              </button>
            )}
          </div>
        </div>

        <textarea
          value={accounts}
          onChange={(e) => setAccounts(e.target.value)}
          placeholder="Ingresa las cuentas (una por línea)&#10;Formato: usuario:contraseña&#10;Ejemplo: usuario1:contraseña1"
          className="w-full h-40 bg-[#1A1A1A] text-white rounded-lg p-4 mb-4 border border-[#333333] focus:border-yellow-400/50 focus:outline-none transition-colors resize-none font-mono text-sm"
          disabled={isChecking}
        />

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
            <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <button
          onClick={handleCheck}
          disabled={isChecking}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
            isChecking
              ? 'bg-[#2A2A2A] text-gray-400 cursor-not-allowed'
              : 'bg-yellow-400 hover:bg-yellow-500 text-black'
          }`}
        >
          <FiZap className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
          {isChecking ? 'Verificando...' : 'Verificar Cuentas'}
        </button>

        {results.length > 0 && (
          <div className="mt-6 space-y-3">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border ${
                  result.success
                    ? 'bg-[#111111] border-green-500/20 shadow-green-500/5'
                    : 'bg-[#111111] border-red-500/20 shadow-red-500/5'
                } shadow-lg`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm text-gray-400">
                    {result.account}
                  </span>
                  <button
                    onClick={() => copyToClipboard(result, index)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {copiedIndex === index ? (
                      <FiCheck className="w-4 h-4 text-green-400" />
                    ) : (
                      <FiCopy className="w-4 h-4" />
                    )}
                  </button>
                </div>
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
                          <div className="space-y-1 w-full">
                            <div className="flex items-center justify-between">
                              <span>
                                Status: {result.details?.status} | Balance: {result.details?.balance}
                              </span>
                            </div>
                            {result.details?.games && result.details.games.total > 0 && (
                              <div className="mt-2 p-2 bg-[#1A1A1A] rounded-lg">
                                <div className="text-gray-400 mb-1">
                                  Juegos ({result.details.games.total}):
                                </div>
                                <div className="text-sm text-gray-300">
                                  {result.details.games.list.join(', ')}
                                </div>
                              </div>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 