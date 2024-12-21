'use client';
import { useState, useEffect } from 'react';
import { FiCreditCard, FiTrash2, FiCopy, FiCheck, FiX, FiAlertCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { encrypt, decrypt } from '../utils/encryption';

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
  const [showError, setShowError] = useState('');

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
    let cards: string[] = [];
    
    try {
      cards = cardsInput
        .split('\n')
        .map(card => formatCard(card))
        .filter(card => card && isValidCardFormat(card));

      if (cards.length === 0) {
        setShowError('Por favor ingresa tarjetas válidas');
        setTimeout(() => setShowError(''), 3000);
        return;
      }

      if (cards.length > 20) {
        setShowError('Máximo 20 tarjetas permitidas');
        setTimeout(() => setShowError(''), 3000);
        return;
      }

      setIsChecking(true);
      setResults([]);
      setTotalChecked(0);

      for (let i = 0; i < cards.length; i++) {
        try {
          console.log('🔄 Procesando tarjeta:', cards[i]);
          
          // Validar formato de la tarjeta
          if (!isValidCardFormat(cards[i])) {
            throw new Error('Formato de tarjeta inválido');
          }
          
          const dataToEncrypt = JSON.stringify({ card: cards[i] });
          console.log('📦 Datos a encriptar:', dataToEncrypt);
          
          let encryptedData: string;
          try {
            encryptedData = encrypt(dataToEncrypt);
            console.log('🔒 Datos encriptados:', encryptedData);
          } catch (encryptError) {
            console.error('❌ Error al encriptar:', encryptError);
            throw new Error('Error al encriptar los datos');
          }
          
          const response = await fetch('/api/check', {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: encryptedData,
          });

          console.log('📡 Estado de respuesta:', response.status);
          
          const responseText = await response.text();
          console.log('📦 Respuesta recibida:', responseText);
          
          if (!response.ok) {
            console.error('❌ Error en respuesta:', responseText);
            throw new Error('Error en la respuesta del servidor');
          }

          let decryptedData: string;
          try {
            decryptedData = decrypt(responseText);
            console.log('🔓 Datos desencriptados:', decryptedData);
          } catch (decryptError) {
            console.error('❌ Error al desencriptar:', decryptError);
            throw new Error('Error al desencriptar la respuesta');
          }
          
          const data = JSON.parse(decryptedData);
          console.log('📄 Datos finales:', data);

          if (data.error) {
            throw new Error(data.error);
          }

          setResults(prev => [...prev, { 
            card: cards[i], 
            status: data.status,
            details: data.details ? cleanResponse(data.details) : undefined,
            error: data.error
          }]);
          setTotalChecked(i + 1);
        } catch (error) {
          console.error('❌ Error al procesar tarjeta:', error);
          setResults(prev => [...prev, { 
            card: cards[i], 
            status: 'Dead',
            error: error instanceof Error ? error.message : 'Error al verificar la tarjeta'
          }]);
        }
        // Esperar entre cada solicitud para evitar sobrecarga
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    } catch (error) {
      console.error('❌ Error general:', error);
      setShowError(error instanceof Error ? error.message : 'Error al procesar las tarjetas');
    } finally {
      setIsChecking(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto space-y-6"
      >
        <div className="bg-black/50 p-6 rounded-2xl border border-gray-800 backdrop-blur-sm shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-bold text-white flex items-center gap-2"
            >
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <FiCreditCard className="text-yellow-400" />
              </motion.div>
              CC Checker
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-4 py-1 bg-yellow-400/10 rounded-full"
            >
              <span className="text-sm text-yellow-400 font-medium">
                {totalChecked}/20 verificadas
              </span>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <textarea
              value={cardsInput}
              onChange={(e) => setCardsInput(e.target.value)}
              placeholder="Ingresa las tarjetas (máximo 20)&#10;Formato: ccNumber|expMonth|expYear|cvc&#10;Ejemplo: 5200007840000022|09|28|765"
              className="w-full h-40 bg-black/40 text-white rounded-lg p-4 mb-4 
                border border-gray-700 focus:border-yellow-400 focus:ring-2 
                focus:ring-yellow-400/20 focus:outline-none transition-all duration-300 
                resize-none font-mono text-sm backdrop-blur-sm"
            />
          </motion.div>

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={checkCards}
              disabled={isChecking}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300
                flex items-center justify-center gap-2 ${
                isChecking 
                  ? 'bg-gray-700 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:opacity-90'
              }`}
            >
              <FiCreditCard className={`w-4 h-4 ${isChecking ? 'animate-pulse' : ''}`} />
              {isChecking ? 'Verificando...' : 'Verificar Tarjetas'}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setCardsInput('');
                setResults([]);
              }}
              className="p-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 
                transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400/20"
            >
              <FiTrash2 className="w-5 h-5" />
            </motion.button>
          </div>

          <AnimatePresence>
            {showError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-lg"
              >
                <FiAlertCircle className="w-4 h-4" />
                <span className="text-sm">{showError}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              {results.map((result, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-xl border backdrop-blur-sm ${
                    result.status === 'Live'
                      ? 'bg-black/50 border-green-500/20 shadow-green-500/5'
                      : 'bg-black/50 border-red-500/20 shadow-red-500/5'
                  } shadow-lg`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm text-gray-400">
                      {result.card}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => copyToClipboard(result.card, index)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {copiedIndex === index ? (
                        <FiCheck className="w-4 h-4 text-green-400" />
                      ) : (
                        <FiCopy className="w-4 h-4" />
                      )}
                    </motion.button>
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
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
