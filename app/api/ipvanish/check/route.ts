import { NextResponse } from 'next/server';
import { IPVanishAPI } from '../../../utils/ipvanish/ipvanishApi';
import { encrypt, decrypt } from '../../../utils/encryption';

export async function POST(request: Request) {
  const encoder = new TextEncoder();

  try {
    // Desencriptar los datos recibidos
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

    (async () => {
      try {
        for (const account of accounts) {
          const [username, password] = account.split(':');
          if (!username || !password) {
            await sendResult({
              account,
              success: false,
              error: 'Formato inválido'
            });
            continue;
          }

          try {
            const api = new IPVanishAPI();
            const result = await api.checkAccount(username, password);
            await sendResult({
              account,
              ...result
            });
          } catch (error: any) {
            await sendResult({
              account,
              success: false,
              error: error.message || 'Error al verificar la cuenta'
            });
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