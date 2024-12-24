'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiScissors, FiCopy, FiCheck, FiAlertCircle } from 'react-icons/fi';

export default function ClearCombo() {
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleClearCombo = () => {
    if (!input.trim()) {
      setError('Por favor, ingresa al menos una línea para limpiar');
      return;
    }

    try {
      const lines = input.split('\n');
      const cleanedLines = lines.map(line => {
        const pipeIndex = line.indexOf('|');
        if (pipeIndex === -1) return line;
        return line.substring(0, pipeIndex);
      }).filter(Boolean);

      setOutput(cleanedLines.join('\n'));
      setError(null);
    } catch (err) {
      setError('Error al procesar el texto');
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError('Error al copiar al portapapeles');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/50 p-6 rounded-2xl border border-gray-800 backdrop-blur-sm shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FiScissors className="text-yellow-400" />
            Clear Combo
          </h2>
        </div>

        {/* Input de Texto */}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ingresa el texto para limpiar (una línea por combo)&#10;Formato: email:pass|etc o user:pass|etc"
          className="w-full h-40 bg-black/40 text-white rounded-lg p-4 mb-4 border border-gray-700 
            focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 focus:outline-none 
            transition-all duration-300 backdrop-blur-sm resize-none font-mono text-sm"
        />

        {/* Mensajes de Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg 
                text-red-400 text-sm flex items-center gap-2"
            >
              <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botón de Limpiar */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleClearCombo}
          className="w-full py-3 px-4 rounded-lg font-medium transition-all 
            flex items-center justify-center gap-2 
            bg-gradient-to-r from-yellow-400 to-orange-500 hover:opacity-90"
        >
          <FiScissors className="w-4 h-4" />
          Limpiar Combo
        </motion.button>

        {/* Output */}
        {output && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-4"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">Resultado</h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={copyToClipboard}
                className="px-4 py-2 bg-green-500/10 text-green-400 rounded-lg 
                  hover:bg-green-500/20 transition-colors flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <FiCheck className="w-4 h-4" />
                    Copiado
                  </>
                ) : (
                  <>
                    <FiCopy className="w-4 h-4" />
                    Copiar
                  </>
                )}
              </motion.button>
            </div>
            <textarea
              value={output}
              readOnly
              className="w-full h-40 bg-black/40 text-white rounded-lg p-4 border border-gray-700 
                focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 focus:outline-none 
                transition-all duration-300 backdrop-blur-sm resize-none font-mono text-sm"
            />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
<<<<<<< HEAD
}
=======
} 
>>>>>>> 00fe4144b4701c29df9139564bb74d80b9fabe1f
