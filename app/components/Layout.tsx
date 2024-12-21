'use client';
import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from "next-auth/react";
import { FiMenu, FiX, FiCreditCard, FiZap, FiLogOut, FiUser, FiPlay, FiChevronRight, FiHome } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface LayoutProps {
  children?: React.ReactNode;
  onToolChange?: (tool: 'home' | 'checker' | 'gen' | 'fansly' | 'steam' | 'disney' | 'crunchyroll') => void;
}

const menuItems = [
  { id: 'home', label: 'Inicio', icon: FiHome, category: 'General' },
  { id: 'checker', label: 'Card Checker', icon: FiCreditCard, category: 'Cards' },
  { id: 'gen', label: 'Card Generator', icon: FiCreditCard, category: 'Cards' },
  { id: 'fansly', label: 'Fansly Checker', icon: FiUser, category: 'Accounts' },
  { id: 'steam', label: 'Steam Checker', icon: FiUser, category: 'Accounts' },
  { id: 'disney', label: 'Disney+ Checker', icon: FiPlay, category: 'Streaming' },
  { id: 'crunchyroll', label: 'Crunchyroll Checker', icon: FiPlay, category: 'Streaming' },
] as const;

export default function Layout({ children, onToolChange }: LayoutProps) {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTool, setCurrentTool] = useState<typeof menuItems[number]['id']>('home');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleToolChange = (tool: typeof menuItems[number]['id']) => {
    setCurrentTool(tool);
    setIsMenuOpen(false);
    if (onToolChange) {
      onToolChange(tool);
    }
  };

  if (!isMounted) {
    return null;
  }

  if (status === "loading") {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="text-yellow-400"
        >
          <FiZap className="w-12 h-12" />
        </motion.div>
      </motion.div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/50 p-8 rounded-2xl border border-gray-800 backdrop-blur-sm shadow-2xl max-w-md w-full"
        >
          <div className="flex flex-col items-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="relative w-20 h-20"
            >
              <div className="absolute inset-0 bg-yellow-400/20 rounded-full animate-pulse"></div>
              <FiZap className="w-20 h-20 text-yellow-400 relative z-10" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold text-white text-center bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent"
            >
              Energy Tools
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-400 text-center"
            >
              Inicia sesión con Discord para acceder a las herramientas
            </motion.p>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => signIn('discord')}
              className="w-full py-3 px-4 bg-[#5865F2] text-white rounded-lg font-medium 
                transition-all flex items-center justify-center gap-2 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#5865F2] to-[#4752C4] 
                opacity-0 group-hover:opacity-100 transition-opacity"
              />
              <svg className="w-5 h-5 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <span className="relative z-10">Iniciar sesión con Discord</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Agrupar elementos del menú por categoría
  const menuByCategory = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof menuItems>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-black/50 backdrop-blur-sm border-b border-gray-800 text-white p-4 
          flex justify-between items-center fixed top-0 w-full z-50"
      >
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center space-x-3"
        >
          <FiZap className="w-6 h-6 text-yellow-400" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 
            bg-clip-text text-transparent"
          >
            Energy Tools
          </h1>
        </motion.div>

        <div className="flex items-center space-x-4">
          {session?.user?.image && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden md:flex items-center space-x-3"
            >
              <span className="text-sm text-gray-400">{session.user.name}</span>
              <Image
                src={session.user.image}
                alt="Profile"
                width={32}
                height={32}
                className="rounded-full ring-2 ring-yellow-400/20"
              />
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => signOut()}
            className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
            title="Cerrar sesión"
          >
            <FiLogOut className="w-5 h-5 text-gray-400 hover:text-white" />
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors md:hidden"
          >
            {isMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </motion.button>
        </div>
      </motion.header>

      {/* Sidebar */}
      <motion.nav
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="fixed top-16 left-0 w-64 bg-black/50 backdrop-blur-sm border-r 
          border-gray-800 h-[calc(100vh-4rem)] z-40 hidden md:block overflow-y-auto"
      >
        <div className="p-4 space-y-6">
          {Object.entries(menuByCategory).map(([category, items]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">
                {category}
              </h3>
              {items.map((item) => (
                <motion.button
                  key={item.id}
                  whileHover={{ x: 4 }}
                  onClick={() => handleToolChange(item.id)}
                  className={`w-full p-3 rounded-lg flex items-center gap-3 ${
                    currentTool === item.id 
                      ? 'bg-yellow-400/10 text-yellow-400' 
                      : 'hover:bg-gray-800/50 text-gray-400 hover:text-white'
                  } transition-colors`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </motion.button>
              ))}
            </div>
          ))}
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.div
              initial={{ x: 300 }}
              animate={{ x: 0 }}
              exit={{ x: 300 }}
              className="fixed top-16 right-0 w-64 bg-black/80 backdrop-blur-sm border-l 
                border-gray-800 h-[calc(100vh-4rem)] z-40 md:hidden overflow-y-auto"
            >
              <div className="p-4 space-y-6">
                {/* Mobile user info */}
                {session?.user?.image && (
                  <div className="flex items-center gap-3 p-3 border-b border-gray-800">
                    <Image
                      src={session.user.image}
                      alt="Profile"
                      width={40}
                      height={40}
                      className="rounded-full ring-2 ring-yellow-400/20"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {session.user.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {session.user.email}
                      </p>
                    </div>
                  </div>
                )}

                {/* Mobile menu items */}
                {Object.entries(menuByCategory).map(([category, items]) => (
                  <div key={category} className="space-y-2">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">
                      {category}
                    </h3>
                    {items.map((item) => (
                      <motion.button
                        key={item.id}
                        whileHover={{ x: -4 }}
                        onClick={() => handleToolChange(item.id)}
                        className={`w-full p-3 rounded-lg flex items-center gap-3 ${
                          currentTool === item.id 
                            ? 'bg-yellow-400/10 text-yellow-400' 
                            : 'hover:bg-gray-800/50 text-gray-400 hover:text-white'
                        } transition-colors`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </motion.button>
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="pt-20 md:pl-64 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
