'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    console.log("🏠 Home useEffect ejecutándose");
    console.log("📊 Estado de autenticación:", status);
    console.log("👤 Sesión:", session);

    if (status === 'authenticated') {
      console.log("✅ Usuario autenticado, redirigiendo a dashboard");
      router.replace('/dashboard');
    } else if (status === 'unauthenticated') {
      console.log("❌ Usuario no autenticado, redirigiendo a login");
      router.replace('/auth/signin');
    }
  }, [status, router, session]);

  // Mostrar pantalla de carga mientras se verifica la sesión
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Cargando...</h2>
        <p className="text-gray-600">Verificando tu sesión</p>
      </div>
    </div>
  );
}
