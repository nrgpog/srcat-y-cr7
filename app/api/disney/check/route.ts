import { NextResponse } from 'next/server';
import { DisneyAPI } from '../../../utils/disney/disneyApi';
import { encrypt, decrypt } from '../../../utils/encryption';

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
        // Convertir las cuentas al formato requerido por checkBatch
        const accountObjects = accounts.map(account => {
          const [email, password] = account.split(':');
          return { email, password };
        });

        // Procesar las cuentas en lotes
        const results = await DisneyAPI.checkBatch(accountObjects);

        // Enviar resultados
        for (let i = 0; i < results.length; i++) {
          await sendResult({
            account: accounts[i],
            ...results[i]
          });
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