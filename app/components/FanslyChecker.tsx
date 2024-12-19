'use client';

import { useState, useEffect } from 'react';
import { FiZap, FiCheck, FiX, FiAlertCircle, FiCopy } from 'react-icons/fi';

interface CheckResult {
  account: string;
  success: boolean;
  error?: string;
}

export default function FanslyChecker() {
  const [accounts, setAccounts] = useState('');
  const [results, setResults] = useState<CheckResult[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState({ checked: 0, total: 0 });

  useEffect(() => {
    // Limpieza del EventSource cuando el componente se desmonta
    return () => {
      if (window.fanslyCheckerEventSource) {
        window.fanslyCheckerEventSource.close();
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
      const response = await fetch('/api/fansly/check', {
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
        if (done) break;

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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-[#111111] p-6 rounded-2xl border border-[#222222] shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FiZap className="text-yellow-400" />
            Fansly Checker
          </h2>
          {isChecking && (
            <span className="text-sm text-gray-400">
              Verificando: {progress.checked}/{progress.total}
            </span>
          )}
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
                    onClick={() => copyToClipboard(result.account, index)}
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 