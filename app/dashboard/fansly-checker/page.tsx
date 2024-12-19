'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FanslyCheckerForm } from '@/components/FanslyCheckerForm';

export default function FanslyCheckerPage() {
  const [results, setResults] = useState<any[]>([]);

  const handleCheck = async (accounts: string[]) => {
    try {
      const response = await fetch('/api/fansly/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accounts }),
      });
      
      const data = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error('Error al verificar cuentas:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Fansly Checker</CardTitle>
          <CardDescription>
            Verifica múltiples cuentas de Fansly en formato usuario:contraseña
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FanslyCheckerForm onSubmit={handleCheck} />
          
          {results.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Resultados:</h3>
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded ${
                      result.success ? 'bg-green-100' : 'bg-red-100'
                    }`}
                  >
                    <p>{result.account} - {result.success ? 'Válida' : 'Inválida'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 