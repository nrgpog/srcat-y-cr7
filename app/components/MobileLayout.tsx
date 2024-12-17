'use client';
import { useState } from 'react';
import { FiTool, FiCheck, FiGrid, FiSettings, FiMenu, FiX } from 'react-icons/fi';

export default function MobileLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Header Móvil */}
      <header className="bg-black text-white p-4 flex justify-between items-center fixed top-0 w-full z-50">
        <div className="flex items-center space-x-3">
          <FiTool className="w-6 h-6" />
          <h1 className="text-xl font-bold">Tools</h1>
        </div>
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2"
        >
          {isMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
        </button>
      </header>

      {/* Menú lateral móvil */}
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className={`fixed top-0 right-0 w-64 h-full bg-black transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="pt-20 px-4">
            <nav>
              <ul className="space-y-4">
                <li className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg">
                  <FiCheck className="w-5 h-5" />
                  <span>Checkers</span>
                </li>
                <li className="flex items-center space-x-3 p-3 hover:bg-gray-800 rounded-lg">
                  <FiGrid className="w-5 h-5" />
                  <span>Dashboard</span>
                </li>
                <li className="flex items-center space-x-3 p-3 hover:bg-gray-800 rounded-lg">
                  <FiSettings className="w-5 h-5" />
                  <span>Settings</span>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <main className="pt-20 px-4 pb-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold mb-6">Checkers</h2>
          
          {/* Tarjetas en vista móvil */}
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Syntax Checker</h3>
                <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center">
                  <FiCheck className="w-4 h-4" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">Verifica la sintaxis de tu código en tiempo real</p>
              <button className="w-full py-2 bg-black text-white rounded-lg text-sm">
                Iniciar Check
              </button>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Code Quality</h3>
                <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center">
                  <FiCheck className="w-4 h-4" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">Analiza la calidad de tu código y obtén sugerencias</p>
              <button className="w-full py-2 bg-black text-white rounded-lg text-sm">
                Analizar
              </button>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Performance</h3>
                <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center">
                  <FiCheck className="w-4 h-4" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">Mide el rendimiento de tu aplicación</p>
              <button className="w-full py-2 bg-black text-white rounded-lg text-sm">
                Medir
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 