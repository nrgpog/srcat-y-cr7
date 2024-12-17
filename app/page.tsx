'use client';
import { useState, useEffect } from 'react';
import { FiTool, FiCheck, FiGrid, FiSettings, FiMenu } from 'react-icons/fi';
import MobileLayout from './components/MobileLayout';
import DesktopLayout from './components/DesktopLayout';

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Verificar inicialmente
    checkIsMobile();

    // Agregar listener para cambios de tamaño
    window.addEventListener('resize', checkIsMobile);

    // Limpiar listener
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return (
    <>
      {isMobile ? <MobileLayout /> : <DesktopLayout />}
    </>
  );
}