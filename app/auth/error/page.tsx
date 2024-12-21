'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { FiAlertCircle } from 'react-icons/fi';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center p-4">
      <div className="bg-black/50 p-8 rounded-2xl border border-red-500/20 backdrop-blur-sm shadow-2xl max-w-md w-full">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 bg-red-500/20 rounded-full animate-pulse"></div>
            <FiAlertCircle className="w-20 h-20 text-red-500 relative z-10" />
          </div>

          <h1 className="text-3xl font-bold text-white text-center">
            Error de Autenticación
          </h1>

          <p className="text-gray-400 text-center">
            {error === 'CredentialsSignin'
              ? 'Email o contraseña incorrectos'
              : error || 'Ocurrió un error durante la autenticación'}
          </p>

          <a
            href="/auth/signin"
            className="w-full py-3 px-4 bg-red-500/10 text-red-400 rounded-lg font-medium 
              transition-all flex items-center justify-center gap-2 hover:bg-red-500/20"
          >
            Volver al inicio de sesión
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center p-4">
        <div className="bg-black/50 p-8 rounded-2xl border border-gray-800 backdrop-blur-sm shadow-2xl max-w-md w-full">
          <div className="flex flex-col items-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-gray-800 animate-pulse"></div>
            <div className="h-8 w-3/4 bg-gray-800 rounded animate-pulse"></div>
            <div className="h-4 w-1/2 bg-gray-800 rounded animate-pulse"></div>
            <div className="h-12 w-full bg-gray-800 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
