'use client';
import { useState } from 'react';
import { useSession, signIn, signOut } from "next-auth/react";
import { FiMenu, FiX, FiCreditCard, FiZap, FiLogOut, FiUser, FiPlay } from 'react-icons/fi';
import Image from 'next/image';

interface LayoutProps {
  children?: React.ReactNode;
  onToolChange?: (tool: 'checker' | 'gen' | 'fansly' | 'steam' | 'disney' | 'crunchyroll') => void;
}

export default function Layout({ children, onToolChange }: LayoutProps) {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTool, setCurrentTool] = useState<'checker' | 'gen' | 'fansly' | 'steam' | 'disney' | 'crunchyroll'>('checker');

  const handleToolChange = (tool: 'checker' | 'gen' | 'fansly' | 'steam' | 'disney' | 'crunchyroll') => {
    setCurrentTool(tool);
    setIsMenuOpen(false);
    if (onToolChange) {
      onToolChange(tool);
    }
  };

  // Pantalla de carga
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="animate-spin text-yellow-400">
          <FiZap className="w-8 h-8" />
        </div>
      </div>
    );
  }

  // Pantalla de login
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
        <div className="bg-[#111111] p-8 rounded-2xl border border-[#222222] shadow-lg max-w-md w-full">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 bg-yellow-400/20 rounded-full animate-pulse"></div>
              <FiZap className="w-16 h-16 text-yellow-400 relative z-10" />
            </div>
            <h1 className="text-2xl font-bold text-white text-center">
              Energy Tools
            </h1>
            <p className="text-gray-400 text-center">
              Inicia sesión con Discord para acceder a las herramientas
            </p>
            <button
              onClick={() => signIn('discord')}
              className="w-full py-3 px-4 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#5865F2] to-[#4752C4] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <svg className="w-5 h-5 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <span className="relative z-10">Iniciar sesión con Discord</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] relative">
      {/* Header */}
      <header className="bg-[#111111] text-white p-4 flex justify-between items-center fixed top-0 w-full z-50 border-b border-[#222222]">
        <div className="flex items-center space-x-3">
          <FiCreditCard className="w-6 h-6 text-yellow-400" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Energy Tools
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          {/* Perfil del usuario */}
          {session?.user?.image && (
            <div className="hidden md:flex items-center space-x-2">
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
          {/* Botón de cerrar sesión */}
          <button
            onClick={() => signOut()}
            className="p-2 hover:bg-[#1E1E1E] rounded-lg transition-colors"
            title="Cerrar sesión"
          >
            <FiLogOut className="w-5 h-5 text-gray-400 hover:text-white" />
          </button>
          {/* Botón del menú */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-[#1E1E1E] rounded-lg transition-colors"
          >
            {isMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Menú lateral */}
      <div 
        className={`fixed top-16 right-0 w-64 bg-[#111111] border-l border-[#222222] h-[calc(100vh-4rem)] z-40 transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 space-y-2">
          {/* Información del usuario en móvil */}
          {session?.user?.image && (
            <div className="md:hidden p-4 border-b border-[#222222] mb-4">
              <div className="flex items-center space-x-3">
                <Image
                  src={session.user.image}
                  alt="Profile"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <div>
                  <p className="text-white font-medium">{session.user.name}</p>
                  <p className="text-sm text-gray-400">{session.user.email}</p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => handleToolChange('checker')}
            className={`w-full p-3 rounded-lg flex items-center gap-3 ${
              currentTool === 'checker' ? 'bg-[#1A1A1A]' : 'hover:bg-[#1A1A1A]'
            } transition-colors text-white`}
          >
            <FiCreditCard className="w-5 h-5 text-yellow-400" />
            <span>Card Checker</span>
          </button>
          <button
            onClick={() => handleToolChange('gen')}
            className={`w-full p-3 rounded-lg flex items-center gap-3 ${
              currentTool === 'gen' ? 'bg-[#1A1A1A]' : 'hover:bg-[#1A1A1A]'
            } transition-colors text-white`}
          >
            <FiCreditCard className="w-5 h-5 text-yellow-400" />
            <span>Card Generator</span>
          </button>
          <button
            onClick={() => handleToolChange('fansly')}
            className={`w-full p-3 rounded-lg flex items-center gap-3 ${
              currentTool === 'fansly' ? 'bg-[#1A1A1A]' : 'hover:bg-[#1A1A1A]'
            } transition-colors text-white`}
          >
            <FiUser className="w-5 h-5 text-yellow-400" />
            <span>Fansly Checker</span>
          </button>
          <button
            onClick={() => handleToolChange('steam')}
            className={`w-full p-3 rounded-lg flex items-center gap-3 ${
              currentTool === 'steam' ? 'bg-[#1A1A1A]' : 'hover:bg-[#1A1A1A]'
            } transition-colors text-white`}
          >
            <FiUser className="w-5 h-5 text-yellow-400" />
            <span>Steam Checker</span>
          </button>
          <button
            onClick={() => handleToolChange('disney')}
            className={`w-full p-3 rounded-lg flex items-center gap-3 ${
              currentTool === 'disney' ? 'bg-[#1A1A1A]' : 'hover:bg-[#1A1A1A]'
            } transition-colors text-white`}
          >
            <FiPlay className="w-5 h-5 text-yellow-400" />
            <span>Disney+ Checker</span>
          </button>
          <button
            onClick={() => handleToolChange('crunchyroll')}
            className={`w-full p-3 rounded-lg flex items-center gap-3 ${
              currentTool === 'crunchyroll' ? 'bg-[#1A1A1A]' : 'hover:bg-[#1A1A1A]'
            } transition-colors text-white`}
          >
            <FiPlay className="w-5 h-5 text-yellow-400" />
            <span>Crunchyroll Checker</span>
          </button>
        </div>
      </div>

      {/* Overlay para cerrar el menú */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Contenido Principal */}
      <main className="pt-20 px-4 pb-6">
        <div className="max-w-2xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
