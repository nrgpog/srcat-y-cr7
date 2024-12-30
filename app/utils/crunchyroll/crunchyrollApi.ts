import axios, { AxiosResponse, AxiosRequestConfig } from 'axios-https-proxy-fix';
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

export class CrunchyrollAPI {
  private baseUrl: string;
  private headers: Record<string, string>;
  private sessionId: string;
  private static readonly ZONE_ID = "44D1EC35";
  private static readonly API_KEY = "FECC4A2303E848B7A69F8647D123B3EB";

  constructor() {
    this.baseUrl = 'https://beta-api.crunchyroll.com';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
      'Origin': 'https://www.crunchyroll.com',
      'Referer': 'https://www.crunchyroll.com/',
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
          username: `zone-${CrunchyrollAPI.ZONE_ID}-session-${this.sessionId}`,
          password: CrunchyrollAPI.API_KEY
        }
      }
    };
  }

  private async makeRequest(config: AxiosRequestConfig): Promise<AxiosResponse> {
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

  private generateDeviceId(): string {
    return Math.random().toString().repeat(2).substring(2, 20);
  }

  async checkAccount(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const loginResult = await this.login(username, password);
      
      if (loginResult.success && loginResult.data) {
        return { success: true };
      }
      
      return { 
        success: false, 
        error: loginResult.error?.message || 'Error desconocido' 
      };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Error al verificar la cuenta' 
      };
    }
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const deviceId = this.generateDeviceId();
      console.log('🔄 Iniciando solicitud de login...');

      const response = await this.makeRequest({
        method: 'post',
        url: `${this.baseUrl}/auth/v1/token`,
        data: {
          username,
          password,
          grant_type: 'password',
          scope: 'offline_access'
        }
      });

      if (response.data.access_token) {
        const sessionData = {
          accountId: response.data.account_id,
          id: response.data.access_token,
          token: response.data.access_token
        };
        
        return {
          success: true,
          data: sessionData
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
} 