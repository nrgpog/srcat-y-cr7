'use client';
import { useState } from 'react';
import { FiZap, FiMenu, FiX, FiTrash2, FiCopy, FiCheck } from 'react-icons/fi';

export default function EnergyChecker() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cardsInput, setCardsInput] = useState('');
  const [results, setResults] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const [totalChecked, setTotalChecked] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Función para limpiar el formato de la tarjeta
  const formatCard = (card) => {
    return card.replace(/[^\d|]/g, '');
  };

  // Función para validar el formato de la tarjeta
  const isValidCardFormat = (card) => {
    const parts = card.split('|');
    return parts.length === 4 && parts[0].length >= 13;
  };

  // Función para verificar las tarjetas
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
        setResults(prev => [...prev, { card: cards[i], ...data }]);
        setTotalChecked(i + 1);
      } catch (error) {
        setResults(prev => [...prev, { 
          card: cards[i], 
          error: 'Error al verificar la tarjeta'
        }]);
      }
      // Pequeña pausa entre verificaciones
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    setIsChecking(false);
  };

  // Función para copiar al portapapeles
  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

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
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 hover:bg-[#1E1E1E] rounded-lg transition-colors"
        >
          {isMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
        </button>
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
