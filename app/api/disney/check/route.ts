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

// Configuración optimizada para maximizar cuentas verificadas
const CONFIG = {
  BATCH_SIZE: 1,           // Una cuenta a la vez para evitar conflictos de proxy
  ACCOUNT_TIMEOUT: 10000,  // 10 segundos por cuenta
  MAX_RETRIES: 1,          // 1 reintento para ahorrar tiempo
  RETRY_DELAY: 1000,       // 1 segundo entre reintentos
  TOTAL_TIMEOUT: 55000,    // 55 segundos (dejando 5s de margen para Vercel)
  ACCOUNT_DELAY: 500       // Delay mínimo entre cuentas
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function checkAccountWithRetry(
  account: string,
  retryCount = 0
): Promise<AccountResult> {
  const [email, password] = account.split(':');
  
  if (!email || !password) {
    return {
      account,
      success: false,
      error: 'Formato inválido'
    } as AccountResult;
  }

  try {
    // Crear una nueva instancia de API para cada intento
    const api = new DisneyAPI();
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), CONFIG.ACCOUNT_TIMEOUT);
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
    // Solo un reintento si es necesario
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
        let processedAccounts = 0;
        const totalAccounts = accounts.length;

        for (let i = 0; i < accounts.length; i += CONFIG.BATCH_SIZE) {
          // Verificar si nos acercamos al tiempo límite
          if (Date.now() - startTime > CONFIG.TOTAL_TIMEOUT) {
            const remainingAccounts = totalAccounts - processedAccounts;
            await sendResult({
              account: 'system',
              success: false,
              error: `Tiempo límite de Vercel alcanzado. Procesadas ${processedAccounts} de ${totalAccounts} cuentas. Quedan ${remainingAccounts} cuentas por procesar.`
            });
            break;
          }

          const batch = accounts.slice(i, i + CONFIG.BATCH_SIZE);
          
          // Procesar una cuenta a la vez
          for (const account of batch) {
            try {
              const result = await checkAccountWithRetry(account);
              await sendResult(result);
              processedAccounts++;
              
              // Pequeña pausa entre cuentas, solo si no es la última
              if (processedAccounts < totalAccounts) {
                await sleep(CONFIG.ACCOUNT_DELAY);
              }
            } catch (error) {
              console.error('Error procesando cuenta:', error);
              processedAccounts++;
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