import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Verificar que la clave de encriptación esté disponible
  if (!process.env.ENCRYPTION_KEY) {
    console.error('❌ ENCRYPTION_KEY no está configurada');
    return new NextResponse(
      JSON.stringify({ error: 'Error de configuración del servidor' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }

  // Verificar que la clave tenga el formato correcto
  const keyBuffer = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  if (keyBuffer.length !== 32) {
    console.error('❌ ENCRYPTION_KEY debe ser de 32 bytes');
    return new NextResponse(
      JSON.stringify({ error: 'Error de configuración del servidor' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }

  // No interferir con las rutas de autenticación y recursos estáticos
  if (
    request.nextUrl.pathname.startsWith('/api/auth') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/static') ||
    request.nextUrl.pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
} 