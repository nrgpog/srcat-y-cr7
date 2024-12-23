import { NextResponse } from 'next/server';
import { DisneyAPI } from '../../../utils/disney/disneyApi';
import { encrypt, decrypt } from '../../../utils/encryption';

interface CheckResult {
  success: boolean;
  error?: string;
  details?: {
    subscription?: string;
    subType?: string;
    description?: string;
    expireDate?: string;
    nextRenewalDate?: string;
    freeTrial?: string;
    lastConnection?: string;
    voucherCode?: string;
    earlyAccess?: string;
    emailVerified?: boolean;
    securityFlagged?: boolean;
    country?: string;
    maxProfiles?: number;
    userVerified?: boolean;
    email?: string;
    createdAt?: string;
  };
}

interface AccountResult extends CheckResult {
  account: string;
}

const BATCH_SIZE = 2; // Tamaño del lote reducido para Vercel
const TIMEOUT = 8000; // 8 segundos para estar dentro del límite de Vercel

export async function POST(request: Request) {
  const encoder = new TextEncoder();

  try {
    const encryptedData = await request.text();
    console.log('📦 Datos encriptados recibidos:', encryptedData);
    
    let accounts: string[];
    try {
      const decryptedData = decrypt(encryptedData);
      console.log('🔓 Datos desencriptados:', decryptedData);
      accounts = JSON.parse(decryptedData);
    } catch (decryptError) {
      console.error('❌ Error al desencriptar/procesar datos:', decryptError);
      throw new Error('Error al desencriptar los datos');
    }

    if (!Array.isArray(accounts)) {
      const errorResponse = encrypt(JSON.stringify({ error: 'El formato de entrada debe ser un array de cuentas' }));
      return new Response(errorResponse, {
        status: 400,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const sendResult = async (result: AccountResult) => {
      const encryptedResult = encrypt(JSON.stringify({ result }));
      const data = encoder.encode(`data: ${encryptedResult}\n\n`);
      await writer.write(data);
    };

    (async () => {
      try {
        // Procesar cuentas en lotes pequeños
        for (let i = 0; i < accounts.length; i += BATCH_SIZE) {
          const batch = accounts.slice(i, i + BATCH_SIZE);
          
          // Procesar cada cuenta en el lote con un timeout
          const promises = batch.map(async (account) => {
            const [email, password] = account.split(':');
            if (!email || !password) {
              return {
                account,
                success: false,
                error: 'Formato inválido'
              } as AccountResult;
            }

            try {
              const api = new DisneyAPI();
              const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Timeout')), TIMEOUT);
              });

              const result = await Promise.race([
                api.checkAccount(email, password),
                timeoutPromise
              ]) as CheckResult;

              return {
                account,
                success: result.success,
                error: result.error,
                details: result.details
              } as AccountResult;
            } catch (error: any) {
              return {
                account,
                success: false,
                error: error.message === 'Timeout' ? 'Tiempo de espera agotado' : error.message || 'Error al verificar la cuenta'
              } as AccountResult;
            }
          });

          // Esperar a que se complete el lote actual
          const results = await Promise.all(promises);
          for (const result of results) {
            await sendResult(result);
          }
        }
      } catch (error) {
        console.error('Error en el stream:', error);
      } finally {
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error: any) {
    const errorResponse = encrypt(JSON.stringify({ 
      error: `Error al procesar la solicitud: ${error.message}` 
    }));
    
    return new Response(errorResponse, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
} 