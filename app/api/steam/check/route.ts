import { NextResponse } from 'next/server';
import { SteamAPI } from '../../../utils/steam/steamApi';
import { encrypt, decrypt } from '../../../utils/encryption';

const BATCH_SIZE = 5;

async function checkAccount(account: string) {
  try {
    const [username, password] = account.split(':');
    if (!username || !password) {
      return {
        account,
        success: false,
        error: 'Formato inválido'
      };
    }

    const api = new SteamAPI();
    const result = await api.checkAccount(username, password);
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
}

export async function POST(req: Request) {
  try {
    // Desencriptar los datos recibidos
    const encryptedData = await req.text();
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
      const errorResponse = encrypt(JSON.stringify({ 
        error: 'El formato de las cuentas es inválido' 
      }));
      return new Response(errorResponse, {
        status: 400,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    const results = [];
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const processAccounts = async () => {
      for (let i = 0; i < accounts.length; i += BATCH_SIZE) {
        const batch = accounts.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(batch.map(checkAccount));
        
        for (const result of batchResults) {
          results.push(result);
          const encryptedResult = encrypt(JSON.stringify({ result }));
          await writer.write(
            encoder.encode(`data: ${encryptedResult}\n\n`)
          );
        }
      }
      await writer.close();
    };

    processAccounts();

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error: any) {
    const errorResponse = encrypt(JSON.stringify({ 
      error: 'Error interno del servidor' 
    }));
    return new Response(errorResponse, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
} 