'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Layout from './components/Layout';
import CCChecker from './components/CCChecker';
import CCGen from './components/CCGen';
import FanslyChecker from './components/FanslyChecker';
import SteamChecker from './components/SteamChecker';
import DisneyChecker from './components/DisneyChecker';

export default function Home() {
  const { data: session, status } = useSession();
  const [currentTool, setCurrentTool] = useState<'checker' | 'gen' | 'fansly' | 'steam' | 'disney'>('checker');
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return null;
  }

  if (!session) {
    return null;
  }

  return (
    <Layout onToolChange={setCurrentTool}>
      {currentTool === 'checker' && <CCChecker />}
      {currentTool === 'gen' && <CCGen />}
      {currentTool === 'fansly' && <FanslyChecker />}
      {currentTool === 'steam' && <SteamChecker />}
      {currentTool === 'disney' && <DisneyChecker />}
    </Layout>
  );
}
