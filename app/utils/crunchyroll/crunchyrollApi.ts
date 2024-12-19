import axios from 'axios-https-proxy-fix';
import crypto from 'crypto';

interface SessionData {
  access_token: string;
  userId: string;
  subscription?: string;
  billedIn?: string;
  freeTrial?: boolean;
  payment?: string;
  emailVerified?: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  response?: T;
  code?: string;
}

interface LoginResponse {
  success: boolean;
  data?: SessionData;
  error?: {
    code: string;
    message: string;
    details: any;
    fullError?: {
      status?: number;
      statusText?: string;
      headers?: any;
      data?: any;
    };
  };
}

export class CrunchyrollAPI {
  private baseUrl: string;
  private headers: Record<string, string>;
  private sessionId: string;
  private static readonly ZONE_ID = "03705EEA";
  private static readonly API_KEY = "14245A8F44ED4115ACAAE40E026D7D67";

  constructor() {
    this.baseUrl = 'https://beta-api.crunchyroll.com';
    this.headers = {
      'user-agent': 'Crunchyroll/3.63.1 Android/9 okhttp/4.12.0',
      'authorization': 'Basic eHd4cXhxcmtueWZtZjZ0bHB1dGg6a1ZlQnVUa2JOTGpCbGRMdzhKQk5DTTRSZmlTR3VWa1I=',
      'Content-Type': 'application/x-www-form-urlencoded'
    };
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private getProxyConfig() {
    return {
      proxy: {
        host: "proxy.bytio.com",
        port: 8080,
        auth: {
          username: `zone-${CrunchyrollAPI.ZONE_ID}-session-${this.sessionId}`,
          password: CrunchyrollAPI.API_KEY
        }
      }
    };
  }

  private generateDeviceId(): string {
    return '8004e765-8822-4293-a25a-' + Math.random().toString().substring(2, 14);
  }

  private generateDeviceName(): string {
    return 'SM-' + Math.floor(1000 + Math.random() * 9000).toString();
  }

  private async makeRequest(config: any) {
    try {
      const response = await axios({
        ...config,
        ...this.getProxyConfig(),
        headers: {
          ...this.headers,
          ...config.headers
        }
      });
      return response;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('Sesión no disponible, generando nueva sesión...');
        this.sessionId = this.generateSessionId();
        return this.makeRequest(config);
      }
      throw error;
    }
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const deviceId = this.generateDeviceId();
      const deviceName = this.generateDeviceName();
      console.log('🔄 Iniciando solicitud de login...');

      const response = await this.makeRequest({
        method: 'post',
        url: `${this.baseUrl}/auth/v1/token`,
        data: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&grant_type=password&scope=offline_access&device_id=${deviceId}&device_name=${deviceName}&device_type=${deviceName}`,
      });

      if (response.data.access_token) {
        const accessToken = response.data.access_token;
        
        // Obtener información de la cuenta
        const accountInfo = await this.makeRequest({
          method: 'get',
          url: `${this.baseUrl}/accounts/v1/me`,
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        const userId = accountInfo.data.external_id;
        const emailVerified = accountInfo.data.email_verified;

        // Obtener información de la suscripción
        const subscriptionInfo = await this.makeRequest({
          method: 'get',
          url: `${this.baseUrl}/subs/v1/subscriptions/${userId}/products`,
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        return {
          success: true,
          data: {
            access_token: accessToken,
            userId: userId,
            subscription: subscriptionInfo.data.items?.[0]?.name || 'Free',
            billedIn: subscriptionInfo.data.items?.[0]?.effective_date,
            freeTrial: subscriptionInfo.data.items?.[0]?.active_free_trial || false,
            payment: subscriptionInfo.data.items?.[0]?.source || 'N/A',
            emailVerified: emailVerified
          }
        };
      }

      return {
        success: false,
        error: {
          code: 'INVALID_RESPONSE',
          message: 'Respuesta inválida del servidor',
          details: response.data
        }
      };

    } catch (error: any) {
      const errorResponse: LoginResponse = {
        success: false,
        error: {
          code: error.response?.data?.code || 'ERROR',
          message: error.message,
          details: error.response?.data || error.toString(),
          fullError: {
            status: error.response?.status,
            statusText: error.response?.statusText,
            headers: error.response?.headers,
            data: error.response?.data
          }
        }
      };

      // Manejar errores específicos
      if (error.response?.data?.code === 'invalid_credentials') {
        errorResponse.error.message = 'Credenciales inválidas';
      } else if (error.response?.data?.code === 'force_password_reset') {
        errorResponse.error.message = 'Se requiere restablecer la contraseña';
      }

      return errorResponse;
    }
  }
} 