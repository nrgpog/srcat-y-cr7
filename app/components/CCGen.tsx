'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCreditCard, FiTrash2, FiCopy, FiCheck, FiSettings, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';

interface GeneratorOptions {
  cvv: string;
  month: string;
  year: string;
  useRandom: boolean;
}

interface GeneratedCard {
  number: string;
  cvv: string;
  month: string;
  year: string;
  formatted: string;
}

export default function CCGen() {
  const [bin, setBin] = useState('');
  const [amount, setAmount] = useState('10');
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<GeneratorOptions>({
    cvv: '',
    month: '',
    year: '',
    useRandom: true
  });
  const [copiedAll, setCopiedAll] = useState(false);

  // Validación y formateo del BIN
  const validateBin = (input: string): string | null => {
    const cleanBin = input.replace(/\D/g, '');
    if (cleanBin.length < 6) return null;
    return cleanBin.slice(0, 6);
  };

  // Algoritmo de Luhn mejorado
  const generateLuhnNumber = (prefix: string): string => {
    if (!prefix || prefix.length < 6) return '';

    let cardNumber = prefix;
    while (cardNumber.length < 15) {
      cardNumber += Math.floor(Math.random() * 10).toString();
    }

    let sum = 0;
    let isEven = true;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i]);
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    return cardNumber + checkDigit.toString();
  };

  // Generación de fecha
  const generateExpDate = () => {
    if (!options.useRandom && options.month && options.year) {
      return {
        month: options.month.padStart(2, '0'),
        year: options.year
      };
    }

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const month = Math.floor(Math.random() * 12) + 1;
    const year = currentYear + Math.floor(Math.random() * 6);

    return {
      month: month.toString().padStart(2, '0'),
      year: year.toString().slice(-2)
    };
  };

  // Generación de CVV
  const generateCVV = () => {
    if (!options.useRandom && options.cvv) {
      return options.cvv.padStart(3, '0');
    }
    return Math.floor(Math.random() * 900 + 100).toString();
  };

  const handleGenerate = () => {
    setError('');
    setIsGenerating(true);
    setGeneratedCards([]);

    try {
      const validBin = validateBin(bin);
      if (!validBin) {
        throw new Error('El BIN debe tener al menos 6 dígitos numéricos');
      }

      const qty = Math.min(Math.max(parseInt(amount) || 1, 1), 100);
      const newCards: GeneratedCard[] = [];

      for (let i = 0; i < qty; i++) {
        const cardNumber = generateLuhnNumber(validBin);
        const { month, year } = generateExpDate();
        const cvv = generateCVV();

        if (cardNumber) {
          newCards.push({
            number: cardNumber,
            cvv,
            month,
            year,
            formatted: `${cardNumber}|${month}|${year}|${cvv}`
          });
        }
      }

      setGeneratedCards(newCards);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar las tarjetas');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      setError('Error al copiar al portapapeles');
    }
  };

  const copyAllToClipboard = async () => {
    if (generatedCards.length === 0) return;

    try {
      const allCards = generatedCards.map(card => card.formatted).join('\n');
      await navigator.clipboard.writeText(allCards);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) {
      setError('Error al copiar las tarjetas');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Panel de Control */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/50 p-6 rounded-2xl border border-gray-800 backdrop-blur-sm shadow-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <FiCreditCard className="text-yellow-400" />
              CC Generator
            </h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowOptions(!showOptions)}
              className={`p-2 rounded-lg transition-colors ${
                showOptions ? 'bg-yellow-400 text-black' : 'bg-yellow-400/10 text-yellow-400'
              }`}
            >
              <FiSettings className="w-5 h-5" />
            </motion.button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">BIN (6+ dígitos)</label>
              <input
                type="text"
                value={bin}
                onChange={(e) => setBin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Ejemplo: 552289"
                className="w-full bg-black/40 text-white rounded-lg p-4 border border-gray-700 
                  focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 focus:outline-none 
                  transition-all duration-300 backdrop-blur-sm"
                maxLength={6}
              />
            </div>

            <AnimatePresence>
              {showOptions && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between bg-yellow-400/5 p-4 rounded-lg">
                    <label className="text-gray-400">Usar valores aleatorios</label>
                    <button
                      onClick={() => setOptions({ ...options, useRandom: !options.useRandom })}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        options.useRandom ? 'bg-yellow-400' : 'bg-gray-600'
                      }`}
                    >
                      <motion.div
                        animate={{ x: options.useRandom ? 24 : 2 }}
                        className="w-5 h-5 bg-white rounded-full"
                      />
                    </button>
                  </div>

                  {!options.useRandom && (
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm text-gray-400 mb-1 block">CVV</label>
                        <input
                          type="text"
                          maxLength={3}
                          value={options.cvv}
                          onChange={(e) => setOptions({ ...options, cvv: e.target.value.replace(/\D/g, '') })}
                          placeholder="123"
                          className="w-full bg-black/40 text-white rounded-lg p-3 border border-gray-700 
                            focus:border-yellow-400 focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-400 mb-1 block">Mes</label>
                        <input
                          type="text"
                          maxLength={2}
                          value={options.month}
                          onChange={(e) => setOptions({ ...options, month: e.target.value.replace(/\D/g, '') })}
                          placeholder="MM"
                          className="w-full bg-black/40 text-white rounded-lg p-3 border border-gray-700 
                            focus:border-yellow-400 focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-400 mb-1 block">Año</label>
                        <input
                          type="text"
                          maxLength={2}
                          value={options.year}
                          onChange={(e) => setOptions({ ...options, year: e.target.value.replace(/\D/g, '') })}
                          placeholder="YY"
                          className="w-full bg-black/40 text-white rounded-lg p-3 border border-gray-700 
                            focus:border-yellow-400 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Cantidad (1-100)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                max="100"
                className="w-full bg-black/40 text-white rounded-lg p-4 border border-gray-700 
                  focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 focus:outline-none 
                  transition-all duration-300 backdrop-blur-sm"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-lg"
              >
                <FiAlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerate}
                disabled={isGenerating}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300
                  flex items-center justify-center gap-2 ${
                    isGenerating 
                      ? 'bg-gray-700 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:opacity-90'
                  }`}
              >
                <FiCreditCard className={`w-4 h-4 ${isGenerating ? 'animate-pulse' : ''}`} />
                {isGenerating ? 'Generando...' : 'Generar Tarjetas'}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setBin('');
                  setAmount('10');
                  setGeneratedCards([]);
                  setError('');
                  setOptions({
                    cvv: '',
                    month: '',
                    year: '',
                    useRandom: true
                  });
                }}
                className="p-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 
                  transition-colors"
              >
                <FiTrash2 className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Tarjetas Generadas */}
        <AnimatePresence>
          {generatedCards.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-black/50 p-6 rounded-2xl border border-gray-800 backdrop-blur-sm shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">
                  Tarjetas Generadas ({generatedCards.length})
                </h3>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={copyAllToClipboard}
                  className="px-4 py-2 bg-yellow-400/10 text-yellow-400 rounded-lg 
                    hover:bg-yellow-400/20 transition-colors flex items-center gap-2"
                >
                  {copiedAll ? (
                    <>
                      <FiCheck className="w-4 h-4" />
                      Copiadas
                    </>
                  ) : (
                    <>
                      <FiCopy className="w-4 h-4" />
                      Copiar Todas
                    </>
                  )}
                </motion.button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedCards.map((card, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative group"
                  >
                    {/* Tarjeta con diseño realista */}
                    <div className="relative w-full h-48 bg-gradient-to-br from-gray-800 to-gray-900 
                      rounded-xl p-6 flex flex-col justify-between transform transition-transform 
                      duration-300 group-hover:scale-[1.02] shadow-xl"
                    >
                      {/* Chip y logo */}
                      <div className="flex justify-between items-start">
                        <div className="w-12 h-10 bg-yellow-400/20 rounded-md border border-yellow-400/30" />
                        <FiCreditCard className="w-8 h-8 text-yellow-400/50" />
                      </div>

                      {/* Número de tarjeta */}
                      <div className="space-y-1">
                        <span className="font-mono text-xl text-white tracking-wider">
                          {card.number.match(/.{1,4}/g)?.join(' ')}
                        </span>
                      </div>

                      {/* Fecha y CVV */}
                      <div className="flex justify-between items-end">
                        <div>
                          <span className="text-xs text-gray-400 block mb-1">Válida hasta</span>
                          <span className="font-mono text-white">{card.month}/{card.year}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400 block mb-1">CVV</span>
                          <span className="font-mono text-white">{card.cvv}</span>
                        </div>
                      </div>

                      {/* Botón de copiar */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => copyToClipboard(card.formatted, index)}
                        className="absolute top-2 right-2 p-2 bg-black/50 rounded-full 
                          opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {copiedIndex === index ? (
                          <FiCheck className="w-4 h-4 text-green-400" />
                        ) : (
                          <FiCopy className="w-4 h-4 text-white" />
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
