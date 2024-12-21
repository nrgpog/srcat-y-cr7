'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

interface FanslyCheckerFormProps {
  onSubmit: (accounts: string[]) => void;
}

export function FanslyCheckerForm({ onSubmit }: FanslyCheckerFormProps) {
  const [accounts, setAccounts] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const accountList = accounts
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && line.includes(':'));
      
      await onSubmit(accountList);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="accounts" className="text-sm font-medium">
          Cuentas (formato: usuario:contraseña, una por línea)
        </label>
        <Textarea
          id="accounts"
          value={accounts}
          onChange={(e) => setAccounts(e.target.value)}
          placeholder="usuario1:contraseña1&#10;usuario2:contraseña2"
          className="min-h-[200px]"
          required
        />
      </div>
      
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Verificando...' : 'Verificar Cuentas'}
      </Button>
    </form>
  );
} 