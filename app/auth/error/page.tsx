'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Error de Autenticación
          </h1>
          
          <div className="mb-6">
            <p className="text-gray-600">
              {error === 'OAuthCallback' 
                ? 'Hubo un problema al procesar la autenticación con Discord. Por favor, intenta nuevamente.'
                : 'Ocurrió un error durante el proceso de autenticación.'}
            </p>
          </div>

          <div className="space-y-4">
            <Link 
              href="/auth/signin"
              className="block w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              Volver a Intentar
            </Link>
            
            <Link 
              href="/"
              className="block w-full bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
            >
              Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
