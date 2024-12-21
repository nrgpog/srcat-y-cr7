import { NextResponse } from 'next/server';
import { encrypt, decrypt } from '../../utils/encryption';

export async function POST(request) {
  try {
    console.log('🔄 Iniciando solicitud POST');
    
    // Desencriptar los datos recibidos
    const encryptedData = await request.text();
    console.log('📦 Datos encriptados recibidos:', encryptedData);
    
    try {
      const decryptedData = decrypt(encryptedData);
      console.log('🔓 Datos desencriptados:', decryptedData);
      
      const { card } = JSON.parse(decryptedData);
      console.log('💳 Tarjeta a verificar:', card);

      const response = await fetch(`https://xchecker.cc/api.php?cc=${card}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      console.log('📡 Estado de respuesta del checker:', response.status);
      const data = await response.json();
      console.log('📄 Datos recibidos del checker:', data);
      
      // Encriptar la respuesta antes de enviarla
      const encryptedResponse = encrypt(JSON.stringify(data));
      console.log('🔒 Respuesta encriptada generada');
      
      return new Response(encryptedResponse, {
        headers: {
          'Content-Type': 'text/plain',
        },
      });

    } catch (decryptError) {
      console.error('❌ Error al desencriptar/procesar datos:', decryptError);
      throw new Error(`Error de desencriptación: ${decryptError.message}`);
    }

  } catch (error) {
    console.error('❌ Error general:', error);
    console.error('Stack trace:', error.stack);
    
    const errorResponse = encrypt(JSON.stringify({ 
      error: `Error al procesar la solicitud: ${error.message}` 
    }));
    
    return new Response(errorResponse, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}
