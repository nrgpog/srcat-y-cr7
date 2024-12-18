'use client';
import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from "next-auth/react";
import { FiZap, FiMenu, FiX, FiTrash2, FiCopy, FiCheck, FiLogIn, FiAlertCircle } from 'react-icons/fi';
import Image from 'next/image';

interface CardResult {
  card: string;
  status: 'Live' | 'Dead';
  details?: string;
  error?: string;
}

interface UserSession {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    id?: string | null;
  };
}

export default function EnergyChecker() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [cardsInput, setCardsInput] = useState<string>('');
  const [results, setResults] = useState<CardResult[]>([]);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [totalChecked, setTotalChecked] = useState<number>(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Función para limpiar el formato de la tarjeta
  const formatCard = (card: string): string => {
    return card.replace(/[^\d|]/g, '');
  };

  // Función para validar el formato de la tarjeta
  const isValidCardFormat = (card: string): boolean => {
    const parts = card.split('|');
    return parts.length === 4 && parts[0].length >= 13;
  };

  // Función para verificar las tarjetas
  const checkCards = async () => {
    if (!session) {
      setError('Debes iniciar sesión para usar el checker');
      return;
    }

    setIsChecking(true);
    setResults([]);
    setTotalChecked(0);
    setError(null);

    const cards = cardsInput
      .split('\n')
      .map(card => formatCard(card))
      .filter(card => card && isValidCardFormat(card))
      .slice(0, 20);

    if (cards.length === 0) {
      setError('No se encontraron tarjetas válidas para verificar');
      setIsChecking(false);
      return;
    }

    for (let i = 0; i < cards.length; i++) {
      try {
        const response = await fetch('/api/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ card: cards[i] }),
        });

        if (!response.ok) throw new Error('Error en la verificación');

        const data = await response.json();
        setResults(prev => [...prev, { card: cards[i], ...data }]);
        setTotalChecked(i + 1);
      } catch (error) {
        setResults(prev => [...prev, { 
          card: cards[i], 
          status: 'Dead',
          error: 'Error al verificar la tarjeta'
        }]);
      }
      // Pequeña pausa entre verificaciones
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    setIsChecking(false);
  };

  // Función para copiar al portapapeles
  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Componente de Login
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="bg-[#111111] p-8 rounded-2xl border border-[#222222] shadow-lg max-w-md w-full mx-4">
          <div className="flex flex-col items-center space-y-6">
            <FiZap className="w-12 h-12 text-yellow-400" />
            <h1 className="text-2xl font-bold text-white text-center">
              Energy Checker
            </h1>
            <p className="text-gray-400 text-center">
              Inicia sesión con Discord para acceder al checker
            </p>
            <button
              onClick={() => signIn('discord')}
              className="w-full py-3 px-4 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Iniciar sesión con Discord
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <header className="bg-[#111111] text-white p-4 flex justify-between items-center fixed top-0 w-full z-50 border-b border-[#222222]">
        <div className="flex items-center space-x-3">
          <FiZap className="w-6 h-6 text-yellow-400" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Energy
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          {session?.user?.image && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">
                {session.user.name}
              </span>
              <Image
                src={session.user.image}
                alt="Profile"
                width={32}
                height={32}
                className="rounded-full"
              />
            </div>
          )}
          <button
            onClick={() => signOut()}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="pt-20 px-4 pb-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Panel de entrada */}
          <div className="bg-[#111111] p-6 rounded-2xl border border-[#222222] shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FiZap className="text-yellow-400" />
                Energy Checker
              </h2>
              <span className="text-sm text-gray-400">
                {totalChecked}/20 verificadas
              </span>
            </div>

            <textarea
              value={cardsInput}
              onChange={(e) => setCardsInput(e.target.value)}
              placeholder="Ingresa las tarjetas (máximo 20)&#10;Formato: ccNumber|expMonth|expYear|cvc&#10;Ejemplo: 5200007840000022|09|28|765"
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
                onClick={checkCards}
                disabled={isChecking}
                className={`flex-1 py-3 ${
                  isChecking 
                    ? 'bg-[#222222] cursor-not-allowed' 
                    : 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:opacity-90'
                } text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2`}
              >
                <FiZap className={`w-4 h-4 ${isChecking ? 'animate-pulse' : ''}`} />
                <span>{isChecking ? 'Verificando...' : 'Verificar Tarjetas'}</span>
              </button>

              <button
                onClick={() => {
                  setCardsInput('');
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
                      {result.card}
                    </span>
                    <button
                      onClick={() => copyToClipboard(result.card, index)}
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
                      <div className="flex items-center gap-2">
                        <FiCheck className="w-4 h-4" />
                        <span>{result.details}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <FiX className="w-4 h-4" />
                        <span>{result.error || 'Tarjeta Inválida'}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
