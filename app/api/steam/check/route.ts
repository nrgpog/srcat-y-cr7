import { NextResponse } from 'next/server';
import { SteamAPI } from '../../../utils/steam/steamApi';
import { encrypt, decrypt } from '../../../utils/encryption';

interface CheckResult {
  success: boolean;
  error?: string;
  details?: {
    games?: number;
    level?: number;
    balance?: string;
    country?: string;
    lastLogin?: string;
    emailVerified?: boolean;
    phoneVerified?: boolean;
    steamGuard?: boolean;
    banStatus?: string;
    createdAt?: string;
  };
}

interface AccountResult extends CheckResult {
  account: string;
}

// Configuración optimizada para evitar error 429
const CONFIG = {
  BATCH_SIZE: 1,           // Una cuenta a la vez para evitar conflictos de proxy
  ACCOUNT_TIMEOUT: 15000,  // 15 segundos por cuenta
  MAX_RETRIES: 2,          // 2 reintentos máximo
  RETRY_DELAY: 3000,       // 3 segundos entre reintentos
  TOTAL_TIMEOUT: 50000     // 50 segundos máximo total
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function checkAccountWithRetry(
  account: string,
  retryCount = 0
): Promise<AccountResult> {
  const [username, password] = account.split(':');
  
  if (!username || !password) {
    return {
      account,
      success: false,
      error: 'Formato inválido'
    } as AccountResult;
  }

  try {
    // Crear una nueva instancia de API para cada intento
    const api = new SteamAPI();
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), CONFIG.ACCOUNT_TIMEOUT);
    });

    const result = await Promise.race([
      api.checkAccount(username, password),
      timeoutPromise
    ]) as CheckResult;

    return {
      account,
      success: result.success,
      error: result.error,
      details: result.details
    } as AccountResult;
  } catch (error: any) {
    if (retryCount < CONFIG.MAX_RETRIES) {
      await sleep(CONFIG.RETRY_DELAY);
      return checkAccountWithRetry(account, retryCount + 1);
    }

    return {
      account,
      success: false,
      error: error.message === 'Timeout' ? 
        `Tiempo de espera agotado después de ${retryCount + 1} intentos` : 
        error.message || 'Error al verificar la cuenta'
    } as AccountResult;
  }
}

export async function POST(request: Request) {
  const encoder = new TextEncoder();
  const startTime = Date.now();

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
        for (let i = 0; i < accounts.length; i += CONFIG.BATCH_SIZE) {
          // Verificar si nos acercamos al tiempo límite
          if (Date.now() - startTime > CONFIG.TOTAL_TIMEOUT) {
            await sendResult({
              account: 'system',
              success: false,
              error: 'Tiempo límite de Vercel alcanzado. Por favor, procesa el resto de las cuentas en otra solicitud.'
            });
            break;
          }

          const batch = accounts.slice(i, i + CONFIG.BATCH_SIZE);
          
          // Procesar una cuenta a la vez
          for (const account of batch) {
            try {
              const result = await checkAccountWithRetry(account);
              await sendResult(result);
              // Pequeña pausa entre cuentas
              if (i + CONFIG.BATCH_SIZE < accounts.length) {
                await sleep(1000);
              }
            } catch (error) {
              console.error('Error procesando cuenta:', error);
              continue;
            }
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