import { useState, useEffect } from 'react';
import { FiPlay, FiTrash2, FiCopy, FiCheck, FiX, FiAlertCircle, FiDownload } from 'react-icons/fi';

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

export default function DisneyChecker() {
  const [accountsInput, setAccountsInput] = useState<string>('');
  const [results, setResults] = useState<AccountResult[]>([]);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [totalChecked, setTotalChecked] = useState<number>(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ checked: 0, total: 0 });

  useEffect(() => {
    // Limpieza del EventSource cuando el componente se desmonta
    return () => {
      if ((window as any).disneyCheckerEventSource) {
        (window as any).disneyCheckerEventSource?.close();
      }
    };
  }, []);

  const checkAccounts = async () => {
    if (!accountsInput.trim()) {
      setError('Por favor, ingresa al menos una cuenta para verificar');
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
      const response = await fetch('/api/disney/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(accounts)
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

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyHits = () => {
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
      navigator.clipboard.writeText(hits);
      setCopiedIndex(-1); // Usamos -1 para indicar que se copiaron los hits
      setTimeout(() => setCopiedIndex(null), 2000);
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-[#111111] p-6 rounded-2xl border border-[#222222] shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FiPlay className="text-yellow-400" />
            Disney+ Checker
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
              {progress.checked}/{progress.total} verificadas ({liveCount} hits, {twoFACount} 2FA)
            </span>
            {results.length > 0 && liveCount > 0 && (
              <button
                onClick={copyHits}
                className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors text-sm"
              >
                {copiedIndex === -1 ? <FiCheck /> : <FiDownload />}
                {copiedIndex === -1 ? 'Copiado!' : 'Copiar Hits'}
              </button>
            )}
          </div>
        </div>

        <textarea
          value={accountsInput}
          onChange={(e) => setAccountsInput(e.target.value)}
          placeholder="Ingresa las cuentas&#10;Formato: email:password&#10;Ejemplo: usuario@email.com:contraseña123"
          className="w-full h-40 bg-[#1A1A1A] text-white rounded-lg p-4 mb-4 border border-[#333333] focus:border-yellow-400/50 focus:outline-none transition-colors resize-none font-mono text-sm"
          disabled={isChecking}
        />

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
            <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={checkAccounts}
            disabled={isChecking}
            className={`flex-1 py-3 ${
              isChecking 
                ? 'bg-[#222222] cursor-not-allowed' 
                : 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:opacity-90'
            } text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2`}
          >
            <FiPlay className={`w-4 h-4 ${isChecking ? 'animate-pulse' : ''}`} />
            {isChecking ? 'Verificando...' : 'Verificar Cuentas'}
          </button>

          <button
            onClick={() => {
              setAccountsInput('');
              setResults([]);
              setError(null);
              setProgress({ checked: 0, total: 0 });
            }}
            className="px-4 py-3 bg-[#1A1A1A] text-white rounded-lg hover:bg-[#222222] transition-colors"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
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
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FiCheck className="w-4 h-4" />
                      <span>Cuenta válida</span>
                    </div>
                    {result.details && (
                      <div className="mt-2 p-2 bg-[#1A1A1A] rounded-lg text-gray-300 space-y-1">
                        <p>Suscripción: {result.details.subscription || 'N/A'}</p>
                        <p>Tipo: {result.details.subType || 'N/A'}</p>
                        <p>Descripción: {result.details.description || 'N/A'}</p>
                        <p>Vence: {formatDate(result.details.expireDate)}</p>
                        <p>Próxima renovación: {formatDate(result.details.nextRenewalDate)}</p>
                        <p>Prueba gratuita: {result.details.freeTrial || 'No'}</p>
                        <p>Última conexión: {formatDate(result.details.lastConnection)}</p>
                        <p>País: {result.details.country || 'N/A'}</p>
                        <p>Email verificado: {result.details.emailVerified ? 'Sí' : 'No'}</p>
                        <p>Cuenta segura: {result.details.securityFlagged ? 'No' : 'Sí'}</p>
                      </div>
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
          ))}
        </div>
      )}
    </div>
  );
} 