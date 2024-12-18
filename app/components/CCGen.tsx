'use client';
import { useState } from 'react';
import { FiCreditCard, FiTrash2, FiCopy, FiCheck } from 'react-icons/fi';
import { generateCards } from '../utils/cardGenerator';

export default function CCGen() {
  const [bin, setBin] = useState('');
  const [amount, setAmount] = useState('10');
  const [generatedCards, setGeneratedCards] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleGenerate = () => {
    try {
      const cards = generateCards(bin, parseInt(amount));
      setGeneratedCards(cards.map(card => card.formatted));
    } catch (error) {
      console.error('Error generando tarjetas:', error);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAllToClipboard = () => {
    if (generatedCards.length > 0) {
      const allCards = generatedCards.join('\n');
      navigator.clipboard.writeText(allCards);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-[#111111] p-6 rounded-2xl border border-[#222222] shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FiCreditCard className="text-yellow-400" />
            CC Generator
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={bin}
              onChange={(e) => setBin(e.target.value)}
              placeholder="Ingresa el BIN (ej: 52xxxx)"
              className="w-full bg-[#1A1A1A] text-white rounded-lg p-4 border border-[#333333] focus:border-yellow-400/50 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              max="100"
              className="w-full bg-[#1A1A1A] text-white rounded-lg p-4 border border-[#333333] focus:border-yellow-400/50 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleGenerate}
              className="flex-1 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 hover:opacity-90 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
            >
              <FiCreditCard className="w-4 h-4" />
              Generar Tarjetas
            </button>

            <button
              onClick={() => {
                setBin('');
                setGeneratedCards([]);
              }}
              className="px-4 py-3 bg-[#1A1A1A] text-white rounded-lg hover:bg-[#222222] transition-colors"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {generatedCards.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={copyAllToClipboard}
              className="px-4 py-2 bg-[#1A1A1A] text-white rounded-lg hover:bg-[#222222] transition-colors flex items-center gap-2"
            >
              {copiedAll ? (
                <>
                  <FiCheck className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">Copiado</span>
                </>
              ) : (
                <>
                  <FiCopy className="w-4 h-4" />
                  <span>Copiar Todas</span>
                </>
              )}
            </button>
          </div>
          {generatedCards.map((card, index) => (
            <div
              key={index}
              className="p-4 rounded-xl border bg-[#111111] border-yellow-500/20 shadow-yellow-500/5 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-gray-400">
                  {card}
                </span>
                <button
                  onClick={() => copyToClipboard(card, index)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {copiedIndex === index ? (
                    <FiCheck className="w-4 h-4 text-green-400" />
                  ) : (
                    <FiCopy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 