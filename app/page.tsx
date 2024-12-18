'use client';
import { useState } from 'react';
import Layout from './components/Layout';
import CCChecker from './components/CCChecker';
import CCGen from './components/CCGen';

export default function Home() {
  const [currentTool, setCurrentTool] = useState<'checker' | 'gen'>('checker');

  return (
    <Layout onToolChange={setCurrentTool}>
      {currentTool === 'checker' ? <CCChecker /> : <CCGen />}
    </Layout>
  );
}
