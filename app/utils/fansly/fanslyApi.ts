import axios from 'axios-https-proxy-fix';
import crypto from 'crypto';

interface SessionData {
  accountId: string;
  id: string;
  token: string;
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

export class FanslyAPI {
  private baseUrl: string;
  private headers: Record<string, string>;
  private sessionId: string;
  private static readonly ZONE_ID = "03705EEA";
  private static readonly API_KEY = "14245A8F44ED4115ACAAE40E026D7D67";

  constructor() {
    this.baseUrl = 'https://apiv3.fansly.com/api/v1';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
      'Origin': 'https://fansly.com',
      'Referer': 'https://fansly.com/',
      'Sec-Ch-Ua': '"Google Chrome";v="117", "Not;A=Brand";v="8", "Chromium";v="117"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site',
      'Content-Type': 'application/json'
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
          username: `zone-${FanslyAPI.ZONE_ID}-session-${this.sessionId}`,
          password: FanslyAPI.API_KEY
        }
      }
    };
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
      // Si hay un error 404 de sesión no disponible, genera una nueva sesión y reintenta
      if (error.response?.status === 404) {
        console.log('Sesión no disponible, generando nueva sesión...');
        this.sessionId = this.generateSessionId();
        return this.makeRequest(config);
      }
      throw error;
    }
  }

  private generateDeviceId(): string {
    return Math.random().toString().repeat(2).substring(2, 20);
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const deviceId = this.generateDeviceId();
      console.log('🔄 Iniciando solicitud de login...');

      const response = await this.makeRequest({
        method: 'post',
        url: `${this.baseUrl}/login?ngsw-bypass=true`,
        data: {
          username,
          password,
          deviceId
        }
      });

      if (response.data.success && response.data.response?.session) {
        const sessionData = response.data.response.session;
        this.setAuthData(
          sessionData.accountId,
          sessionData.id,
          sessionData.token
        );
        
        return {
          success: true,
          data: sessionData
        };
      }

      return {
        success: false,
        error: {
          code: response.data.code || 'UNKNOWN',
          message: 'Respuesta inválida del servidor',
          details: response.data
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.response?.data?.code || error.code || 'ERROR',
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
    }
  }

  private setAuthData(accountId: string, sessionId: string, token: string): void {
    if (!accountId || !sessionId || !token) {
      throw new Error('Datos de autenticación incompletos');
    }

    this.headers['fansly-client-id'] = accountId;
    this.headers['fansly-session-id'] = sessionId;
    this.headers['authorization'] = token;
  }
} 