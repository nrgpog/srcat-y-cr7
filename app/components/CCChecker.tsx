'use client';
import { useState } from 'react';
import { FiCreditCard, FiTrash2, FiCopy, FiCheck, FiX } from 'react-icons/fi';

interface CardResult {
  card: string;
  status: 'Live' | 'Dead';
  details?: string;
  error?: string;
}

export default function CCChecker() {
  const [cardsInput, setCardsInput] = useState('');
  const [results, setResults] = useState<CardResult[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [totalChecked, setTotalChecked] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const formatCard = (card: string): string => {
    return card.replace(/[^\d|]/g, '');
  };

  const isValidCardFormat = (card: string): boolean => {
    const parts = card.split('|');
    return parts.length === 4 && parts[0].length >= 13;
  };

  const cleanResponse = (details: string) => {
    if (details.includes("Please consider making a donation")) {
      return "Charge OK";
    }
    return details;
  };

  const checkCards = async () => {
    setIsChecking(true);
    setResults([]);
    setTotalChecked(0);

    const cards = cardsInput
      .split('\n')
      .map(card => formatCard(card))
      .filter(card => card && isValidCardFormat(card))
      .slice(0, 20);

    for (let i = 0; i < cards.length; i++) {
      try {
        const response = await fetch('/api/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ card: cards[i] }),
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        setResults(prev => [...prev, { 
          card: cards[i], 
          status: data.status,
          details: data.details ? cleanResponse(data.details) : undefined,
          error: data.error
        }]);
        setTotalChecked(i + 1);
      } catch (error) {
        setResults(prev => [...prev, { 
          card: cards[i], 
          status: 'Dead',
          error: 'Error al verificar la tarjeta'
        }]);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    setIsChecking(false);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-[#111111] p-6 rounded-2xl border border-[#222222] shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FiCreditCard className="text-yellow-400" />
            CC Checker
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
            <FiCreditCard className={`w-4 h-4 ${isChecking ? 'animate-pulse' : ''}`} />
            {isChecking ? 'Verificando...' : 'Verificar Tarjetas'}
          </button>

          <button
            onClick={() => {
              setCardsInput('');
              setResults([]);
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
  );
} 