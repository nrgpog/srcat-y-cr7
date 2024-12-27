// page.tsx
'use client';
import { useState } from 'react';
import Layout from './components/Layout';
import Home from './components/Home';
import CCChecker from './components/CCChecker';
import CCGen from './components/CCGen';
import FanslyChecker from './components/FanslyChecker';
import SteamChecker from './components/SteamChecker';
import DisneyChecker from './components/DisneyChecker';
import CrunchyrollChecker from './components/CrunchyrollChecker';
import ClearCombo from './components/ClearCombo';
import IRC from './components/IRC';
import IPVanishChecker from './components/IPVanishChecker';
import DiscordChecker from './components/DiscordChecker';

export default function Page() {
  const [currentTool, setCurrentTool] = useState<'home' | 'checker' | 'gen' | 'fansly' | 'steam' | 'disney' | 'crunchyroll' | 'clearcombo' | 'irc' | 'ipvanish' | 'discord'>('home');

  const renderTool = () => {
    switch (currentTool) {
      case 'home':
        return <Home />;
      case 'checker':
        return <CCChecker />;
      case 'gen':
        return <CCGen />;
      case 'fansly':
        return <FanslyChecker />;
      case 'steam':
        return <SteamChecker />;
      case 'disney':
        return <DisneyChecker />;
      case 'crunchyroll':
        return <CrunchyrollChecker />;
      case 'clearcombo':
        return <ClearCombo />;
      case 'irc':
        return <IRC />;
      case 'ipvanish':
        return <IPVanishChecker />;
      case 'discord':
        return <DiscordChecker />;
      default:
        return <Home />;
    }
  };

  return (
    <Layout onToolChange={setCurrentTool}>
      {renderTool()}
    </Layout>
  );
}
