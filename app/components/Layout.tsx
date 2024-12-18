'use client';
import { useState } from 'react';
import { FiMenu, FiX, FiCreditCard } from 'react-icons/fi';
import CCChecker from './CCChecker';
import CCGen from './CCGen';

export default function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTool, setCurrentTool] = useState<'ccchecker' | 'ccgen'>('ccchecker');

  const renderContent = () => {
    switch (currentTool) {
      case 'ccchecker':
        return <CCChecker />;
      case 'ccgen':
        return <CCGen />;
      default:
        return <CCChecker />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] relative">
      {/* Header */}
      <header className="bg-[#111111] text-white p-4 flex justify-between items-center fixed top-0 w-full z-50 border-b border-[#222222]">
        <div className="flex items-center space-x-3">
          <FiCreditCard className="w-6 h-6 text-yellow-400" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            {currentTool === 'ccchecker' && 'CC Checker'}
            {currentTool === 'ccgen' && 'CC Generator'}
          </h1>
        </div>
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 hover:bg-[#1E1E1E] rounded-lg transition-colors"
        >
          {isMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
        </button>
      </header>

      {/* Menú desplegable */}
      <div 
        className={`fixed top-16 right-0 w-64 bg-[#111111] border-l border-[#222222] h-[calc(100vh-4rem)] z-40 transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 space-y-2">
          <button
            onClick={() => {
              setCurrentTool('ccchecker');
              setIsMenuOpen(false);
            }}
            className={`w-full p-3 rounded-lg flex items-center gap-3 ${
              currentTool === 'ccchecker' ? 'bg-[#1A1A1A]' : 'hover:bg-[#1A1A1A]'
            } transition-colors text-white`}
          >
            <FiCreditCard className="w-5 h-5 text-yellow-400" />
            <span>CC Checker</span>
          </button>
          <button
            onClick={() => {
              setCurrentTool('ccgen');
              setIsMenuOpen(false);
            }}
            className={`w-full p-3 rounded-lg flex items-center gap-3 ${
              currentTool === 'ccgen' ? 'bg-[#1A1A1A]' : 'hover:bg-[#1A1A1A]'
            } transition-colors text-white`}
          >
            <FiCreditCard className="w-5 h-5 text-yellow-400" />
            <span>CC Generator</span>
          </button>
        </div>
      </div>

      {/* Overlay para cerrar el menú al hacer clic fuera */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Contenido Principal */}
      <main className="pt-20 px-4 pb-6">
        {renderContent()}
      </main>
    </div>
  );
} 