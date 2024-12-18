'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    console.log("🔄 Dashboard useEffect ejecutándose");
    console.log("📊 Estado actual:", status);
    console.log("👤 Datos de sesión:", session);

    if (status === 'unauthenticated') {
      console.log("❌ Usuario no autenticado, redirigiendo a login");
      router.replace('/auth/signin');
    }
  }, [status, router, session]);

  if (status === 'loading') {
    console.log("⏳ Dashboard en estado de carga");
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Cargando...</h2>
          <p className="text-gray-600">Verificando tu sesión</p>
        </div>
      </div>
    );
  }

  if (!session) {
    console.log("⚠️ No hay sesión disponible en Dashboard");
    return null;
  }

  console.log("✅ Renderizando Dashboard con sesión:", session);
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">Panel de Control</h1>
          <p className="text-gray-600">Bienvenido, {session.user?.name || 'Usuario'}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <h3 className="font-bold text-xl mb-3">Herramientas de Energía</h3>
            <p className="text-gray-600">Accede a todas las herramientas disponibles</p>
          </div>
        </div>
      </div>
    </div>
  );
} 