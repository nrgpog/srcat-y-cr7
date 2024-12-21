// components/Home.tsx
'use client';
import { motion } from 'framer-motion';
import { FiZap, FiGithub, FiMessageCircle, FiStar, FiArrowRight } from 'react-icons/fi';
import { SiDiscord } from 'react-icons/si';

const updates = [
  {
    date: '21/12/2023',
    title: 'Nuevas Características',
    changes: [
      'Añadido soporte para proxies en todos los checkers',
      'Mejorado el diseño de las tarjetas de resultados',
      'Optimización del rendimiento general',
      'Nuevo sistema de copiar hits'
    ]
  },
  {
    date: '20/12/2023',
    title: 'Mejoras de Seguridad',
    changes: [
      'Implementada autenticación mejorada',
      'Añadida protección contra spam',
      'Optimización del generador de tarjetas',
      'Corrección de errores menores'
    ]
  },
  {
    date: '19/12/2023',
    title: 'Nuevos Checkers',
    changes: [
      'Añadido checker de Disney+',
      'Añadido checker de Crunchyroll',
      'Mejorada la precisión de verificación',
      'Nueva interfaz de usuario'
    ]
  }
];

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/50 p-8 rounded-2xl border border-gray-800 backdrop-blur-sm shadow-2xl"
      >
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Bienvenido a Energy Tools
            </h1>
            <p className="text-gray-400 text-lg">
              La suite de herramientas más completa para verificación de cuentas y generación de tarjetas.
            </p>
            <div className="flex flex-wrap gap-4">
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="https://discord.gg/aeolouscm"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] 
                  text-white rounded-lg font-medium transition-colors"
              >
                <SiDiscord className="w-5 h-5" />
                Únete a Discord
              </motion.a>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-6 py-3 bg-yellow-400/10 text-yellow-400 
                  hover:bg-yellow-400/20 rounded-lg font-medium transition-colors"
              >
                <FiStar className="w-5 h-5" />
                Explorar Herramientas
              </motion.button>
            </div>
          </div>
          <div className="relative w-32 h-32 md:w-48 md:h-48">
            <motion.div
              animate={{ 
                rotate: 360,
                scale: [1, 1.1, 1],
              }}
              transition={{ 
                rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
              className="absolute inset-0 bg-yellow-400/20 rounded-full blur-xl"
            />
            <FiZap className="w-full h-full text-yellow-400 relative z-10" />
          </div>
        </div>
      </motion.div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: FiMessageCircle, label: 'Usuarios Activos', value: '1,000+' },
          { icon: FiStar, label: 'Hits Generados', value: '50,000+' },
          { icon: FiGithub, label: 'Actualizaciones', value: '24/7' },
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-black/50 p-6 rounded-xl border border-gray-800 backdrop-blur-sm"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-400/10 rounded-lg">
                <stat.icon className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
                <p className="text-gray-400">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Updates Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/50 p-6 rounded-2xl border border-gray-800 backdrop-blur-sm shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Últimas Actualizaciones</h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-400/10 text-yellow-400 
              hover:bg-yellow-400/20 rounded-lg transition-colors text-sm"
          >
            Ver todas
            <FiArrowRight className="w-4 h-4" />
          </motion.button>
        </div>

        <div className="space-y-6">
          {updates.map((update, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative pl-6 before:content-[''] before:absolute before:left-0 
                before:top-0 before:bottom-0 before:w-px before:bg-gradient-to-b 
                before:from-yellow-400 before:to-transparent"
            >
              <div className="absolute left-0 top-0 w-2 h-2 bg-yellow-400 rounded-full 
                transform -translate-x-[0.3rem]" />
              <div className="mb-2">
                <span className="text-yellow-400 text-sm">{update.date}</span>
                <h3 className="text-lg font-semibold text-white">{update.title}</h3>
              </div>
              <ul className="space-y-2">
                {update.changes.map((change, changeIndex) => (
                  <motion.li
                    key={changeIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: (index * 0.1) + (changeIndex * 0.05) }}
                    className="text-gray-400 flex items-center gap-2"
                  >
                    <div className="w-1 h-1 bg-yellow-400/50 rounded-full" />
                    {change}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Discord Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-[#5865F2] rounded-2xl shadow-2xl"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#5865F2] to-[#4752C4] opacity-50" />
        <div className="relative p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              ¿Necesitas ayuda o quieres estar al día?
            </h2>
            <p className="text-white/80">
              Únete a nuestra comunidad de Discord para obtener soporte, actualizaciones y más.
            </p>
          </div>
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="https://discord.gg/aeolouscm"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-white text-[#5865F2] rounded-lg font-bold 
              flex items-center gap-3 transition-colors hover:bg-gray-100"
          >
            <SiDiscord className="w-6 h-6" />
            Unirse al Discord
          </motion.a>
        </div>
      </motion.div>
    </div>
  );
}
