'use client';
import { useState } from 'react';
import { useSession } from "next-auth/react";
import { FiPlay, FiTrash2, FiCopy, FiCheck, FiX, FiAlertCircle } from 'react-icons/fi';

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

export default function CrunchyrollChecker() {
  const { data: session } = useSession();
  const [accountsInput, setAccountsInput] = useState<string>('');
  const [results, setResults] = useState<AccountResult[]>([]);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [totalChecked, setTotalChecked] = useState<number>(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
    }
  };

  const checkAccounts = async () => {
    if (!session) {
      setError('Debes iniciar sesión para usar el checker');
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
          body: JSON.stringify({ username, password }),
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
      // Pequeña pausa entre verificaciones
      console.log('⏳ Esperando antes de la siguiente verificación...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log('✅ Verificación completada');
    setIsChecking(false);
  };

  return (
    <div className="space-y-6">
      {/* Panel de entrada */}
      <div className="bg-[#111111] p-6 rounded-2xl border border-[#222222] shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FiPlay className="text-yellow-400" />
            Crunchyroll Checker
          </h2>
          <span className="text-sm text-gray-400">
            {totalChecked}/20 verificadas
          </span>
        </div>

        <textarea
          value={accountsInput}
          onChange={(e) => setAccountsInput(e.target.value)}
          placeholder="Ingresa las cuentas (máximo 20)&#10;Formato: email:password&#10;Ejemplo: usuario@email.com:contraseña123"
          className="w-full h-40 bg-[#1A1A1A] text-white rounded-lg p-4 mb-4 border border-[#333333] focus:border-yellow-400/50 focus:outline-none transition-colors resize-none font-mono text-sm"
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
            <span>{isChecking ? 'Verificando...' : 'Verificar Cuentas'}</span>
          </button>

          <button
            onClick={() => {
              setAccountsInput('');
              setResults([]);
              setError(null);
            }}
            className="px-4 py-3 bg-[#1A1A1A] text-white rounded-lg hover:bg-[#222222] transition-colors"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Resultados */}
      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border ${
                result.status === 'Live'
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
                result.status === 'Live' ? 'text-green-400' : 'text-red-400'
              }`}>
                {result.status === 'Live' ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FiCheck className="w-4 h-4" />
                      <span>Cuenta válida</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-gray-400">
                      <div>
                        <span className="font-semibold">Suscripción:</span> {result.subscription}
                      </div>
                      <div>
                        <span className="font-semibold">Facturado:</span> {result.billedIn}
                      </div>
                      <div>
                        <span className="font-semibold">Prueba gratis:</span> {result.freeTrial ? 'Sí' : 'No'}
                      </div>
                      <div>
                        <span className="font-semibold">Método de pago:</span> {result.payment}
                      </div>
                      <div>
                        <span className="font-semibold">Email verificado:</span> {result.emailVerified ? 'Sí' : 'No'}
                      </div>
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
  );
} 