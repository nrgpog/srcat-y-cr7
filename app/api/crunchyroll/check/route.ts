import { NextResponse } from 'next/server';
import axios from 'axios-https-proxy-fix';
import crypto from 'crypto';

const ZONE_ID = "03705EEA";
const API_KEY = "14245A8F44ED4115ACAAE40E026D7D67";

interface CrunchyrollResponse {
  success: boolean;
  data?: {
    subscription?: string;
    billedIn?: string;
    freeTrial?: boolean;
    payment?: string;
    emailVerified?: boolean;
  };
  error?: {
    message: string;
    details?: any;
  };
}

function handleError(error: any): CrunchyrollResponse {
  console.log('❌ Error durante la verificación:', error);
  console.log('Detalles del error:', error.response?.data);

  let errorMessage = 'Error al verificar la cuenta';
  const errorCode = error.response?.data?.code;
  const errorType = error.response?.data?.error;

  if (errorCode === 'auth.obtain_access_token.invalid_credentials' || errorType === 'invalid_grant') {
    errorMessage = 'Cuenta inválida o bloqueada';
  } else if (errorCode === 'force_password_reset') {
    errorMessage = 'Se requiere restablecer la contraseña';
  } else if (error.response?.status === 429) {
    errorMessage = 'Demasiadas solicitudes, espera un momento';
  } else if (error.response?.status === 403) {
    errorMessage = 'Acceso denegado';
  } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    errorMessage = 'Error de conexión, intenta de nuevo';
  }

  return {
    success: false,
    error: {
      message: errorMessage,
      details: error.response?.data || error.message
    }
  };
}

export async function POST(req: Request) {
  try {
    console.log('🔄 Iniciando verificación de cuenta Crunchyroll...');
    const { username, password } = await req.json();
    console.log('📧 Email recibido:', username);

    if (!username || !password) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Usuario y contraseña son requeridos',
          details: null
        }
      });
    }

    const sessionId = crypto.randomBytes(16).toString('hex');
    const deviceId = '8004e765-8822-4293-a25a-' + Math.random().toString().substring(2, 14);
    const deviceName = 'SM-' + Math.floor(1000 + Math.random() * 9000).toString();

    console.log('🔑 Session ID generado:', sessionId);
    console.log('📱 Device ID generado:', deviceId);
    console.log('📱 Device Name generado:', deviceName);

    const proxyConfig = {
      proxy: {
        host: "proxy.bytio.com",
        port: 8080,
        auth: {
          username: `zone-${ZONE_ID}-session-${sessionId}`,
          password: API_KEY
        }
      }
    };

    console.log('🌐 Configuración de proxy:', JSON.stringify(proxyConfig));

    // Login request
    console.log('🔒 Intentando login...');
    try {
      const loginResponse = await axios({
        method: 'post',
        url: 'https://beta-api.crunchyroll.com/auth/v1/token',
        data: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&grant_type=password&scope=offline_access&device_id=${deviceId}&device_name=${deviceName}&device_type=${deviceName}`,
        headers: {
          'user-agent': 'Crunchyroll/3.63.1 Android/9 okhttp/4.12.0',
          'authorization': 'Basic eHd4cXhxcmtueWZtZjZ0bHB1dGg6a1ZlQnVUa2JOTGpCbGRMdzhKQk5DTTRSZmlTR3VWa1I=',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        ...proxyConfig,
        timeout: 10000 // 10 segundos de timeout
      });

      console.log('✅ Respuesta de login recibida:', JSON.stringify(loginResponse.data));

      if (!loginResponse.data.access_token) {
        return NextResponse.json({
          success: false,
          error: {
            message: 'No se pudo obtener el token de acceso',
            details: loginResponse.data
          }
        });
      }

      const accessToken = loginResponse.data.access_token;
      console.log('🎫 Token de acceso obtenido');

      // Get account info
      console.log('👤 Obteniendo información de la cuenta...');
      const accountInfo = await axios({
        method: 'get',
        url: 'https://beta-api.crunchyroll.com/accounts/v1/me',
        headers: {
          'user-agent': 'Crunchyroll/3.63.1 Android/9 okhttp/4.12.0',
          'Authorization': `Bearer ${accessToken}`
        },
        ...proxyConfig,
        timeout: 10000
      });

      console.log('✅ Información de cuenta recibida:', JSON.stringify(accountInfo.data));

      const userId = accountInfo.data.external_id;
      const emailVerified = accountInfo.data.email_verified;

      // Get subscription info
      console.log('💳 Obteniendo información de suscripción...');
      let subscriptionData = {
        subscription: 'Free',
        billedIn: null,
        freeTrial: false,
        payment: 'N/A'
      };

      try {
        const subscriptionInfo = await axios({
          method: 'get',
          url: `https://beta-api.crunchyroll.com/subs/v1/subscriptions/${userId}/products`,
          headers: {
            'user-agent': 'Crunchyroll/3.63.1 Android/9 okhttp/4.12.0',
            'Authorization': `Bearer ${accessToken}`
          },
          ...proxyConfig,
          timeout: 10000
        });

        console.log('✅ Información de suscripción recibida:', JSON.stringify(subscriptionInfo.data));
        
        if (subscriptionInfo.data.items?.length > 0) {
          subscriptionData = {
            subscription: subscriptionInfo.data.items[0].name,
            billedIn: subscriptionInfo.data.items[0].effective_date,
            freeTrial: subscriptionInfo.data.items[0].active_free_trial || false,
            payment: subscriptionInfo.data.items[0].source || 'N/A'
          };
        }
      } catch (error: any) {
        // Si es error 404, significa que no tiene suscripción
        if (error.response?.status === 404) {
          console.log('ℹ️ Cuenta sin suscripción activa');
        } else {
          throw error;
        }
      }

      const response: CrunchyrollResponse = {
        success: true,
        data: {
          ...subscriptionData,
          emailVerified: emailVerified
        }
      };

      console.log('✅ Verificación completada con éxito:', JSON.stringify(response));
      return NextResponse.json(response);

    } catch (error: any) {
      return NextResponse.json(handleError(error));
    }

  } catch (error: any) {
    return NextResponse.json(handleError(error));
  }
} 