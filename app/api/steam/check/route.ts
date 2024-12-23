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
    vacBans?: number;
    tradeBans?: boolean;
    limitedAccount?: boolean;
  };
}

interface AccountResult extends CheckResult {
  account: string;
}

// Configuración optimizada para Vercel
const CONFIG = {
  BATCH_SIZE: 5,           // Número de cuentas por lote
  ACCOUNT_TIMEOUT: 5000,   // 5 segundos por cuenta
  MAX_RETRIES: 2,          // Número máximo de reintentos por cuenta
  RETRY_DELAY: 1000,       // 1 segundo entre reintentos
  TOTAL_TIMEOUT: 50000     // 50 segundos máximo total (para estar dentro del límite de 60s de Vercel)
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function checkAccountWithRetry(
  account: string,
  api: SteamAPI,
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
    if (retryCount < CONFIG.MAX_RETRIES && error.message === 'Timeout') {
      await sleep(CONFIG.RETRY_DELAY);
      return checkAccountWithRetry(account, api, retryCount + 1);
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
        const api = new SteamAPI();
        
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
          const promises = batch.map(account => checkAccountWithRetry(account, api));

          try {
            const results = await Promise.all(promises);
            for (const result of results) {
              await sendResult(result);
            }
          } catch (batchError) {
            console.error('Error procesando lote:', batchError);
            continue; // Continuar con el siguiente lote si hay error
          }

          // Pequeña pausa entre lotes para evitar sobrecarga
          if (i + CONFIG.BATCH_SIZE < accounts.length) {
            await sleep(500);
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