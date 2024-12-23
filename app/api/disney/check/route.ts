import { NextResponse } from 'next/server';
import { DisneyAPI } from '../../../utils/disney/disneyApi';
import { encrypt, decrypt } from '../../../utils/encryption';

const BATCH_SIZE = 2; // Tamaño del lote reducido para evitar timeouts

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

    (async () => {
      try {
        // Procesar las cuentas en lotes pequeños
        for (let i = 0; i < accounts.length; i += BATCH_SIZE) {
          const batchAccounts = accounts.slice(i, i + BATCH_SIZE);
          
          // Convertir y validar las cuentas del lote
          const accountObjects = batchAccounts
            .map(account => {
              const [email, password] = account.split(':');
              return email && password ? { email, password } : null;
            })
            .filter((account): account is { email: string; password: string } => account !== null);

          // Procesar el lote actual
          try {
            const results = await DisneyAPI.checkBatch(accountObjects);
            
            // Enviar resultados del lote
            for (let j = 0; j < results.length; j++) {
              await sendResult({
                account: batchAccounts[j],
                ...results[j]
              });
            }

            // Pequeña pausa entre lotes para evitar sobrecarga
            if (i + BATCH_SIZE < accounts.length) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (batchError) {
            console.error('Error procesando lote:', batchError);
            // Enviar resultados de error para las cuentas del lote
            for (const account of batchAccounts) {
              await sendResult({
                account,
                success: false,
                error: 'Error al verificar la cuenta'
              });
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