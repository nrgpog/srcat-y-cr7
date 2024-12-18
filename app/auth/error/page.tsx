'use client';
import { FiAlertTriangle } from 'react-icons/fi';
import { useSearchParams } from 'next/navigation';

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="bg-[#111111] p-8 rounded-2xl border border-[#222222] shadow-lg max-w-md w-full">
        <div className="flex flex-col items-center space-y-6">
          <FiAlertTriangle className="w-12 h-12 text-red-400" />
          <h1 className="text-2xl font-bold text-white text-center">
            Error de Autenticación
          </h1>
          <p className="text-gray-400 text-center">
            {error === 'AccessDenied' 
              ? 'El acceso ha sido denegado. Por favor, intenta con otra cuenta o contacta al soporte.'
              : 'Ha ocurrido un error durante la autenticación. Por favor, intenta nuevamente.'}
          </p>
          <div className="space-y-3 w-full">
            <button
              onClick={() => window.location.href = '/'}
              className="w-full py-3 px-4 bg-[#2A2A2A] hover:bg-[#333333] text-white rounded-lg font-medium transition-all"
            >
              Volver al inicio
            </button>
            <button
              onClick={() => window.location.href = '/api/auth/signin'}
              className="w-full py-3 px-4 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg font-medium transition-all"
            >
              Intentar con otra cuenta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
