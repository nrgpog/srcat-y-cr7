import axios, { AxiosResponse, AxiosRequestConfig } from 'axios-https-proxy-fix';
import crypto from 'crypto';
import tunnel from 'tunnel';

interface LoginResponse {
  success: boolean;
  data?: {
    email: string;
    accountType: string;
    expiryDate: number;
  };
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

export class IPVanishAPI {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;
  private readonly apiKey: string;
  private readonly clientInfo: { client: string; os: string };
  private sessionId: string;
  private static readonly ZONE_ID = "8E284018";
  private static readonly API_KEY = "FECC4A2303E848B7A69F8647D123B3EB";
  private static readonly MAX_RETRIES = 3;
  private static readonly TIMEOUT = 30000;

  constructor() {
    this.baseUrl = 'https://api.ipvanish.com/api/v3';
    this.headers = {
      'Accept-Encoding': 'gzip',
      'Connection': 'Keep-Alive',
      'Content-Type': 'application/json; charset=UTF-8',
      'Host': 'api.ipvanish.com',
      'User-Agent': 'Android/ipvanish/4.1.4.0.206384-gm',
      'X-API-Version': '3.3',
      'X-Client': 'ipvanish',
      'X-Client-Version': '4.1.4.0.206384-gm',
      'X-Platform': 'Android',
      'X-Platform-Version': '28'
    };
    this.apiKey = '15cb936e6d19cd7db1d6f94b96017541';
    this.clientInfo = {
      client: 'Android-4.1.4.0.206384bnull',
      os: '4.1.4.0.206384-gm'
    };
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private generateUUID(): string {
    return crypto.randomUUID();
  }

  private getProxyConfig() {
    const tunnelAgent = tunnel.httpsOverHttp({
      proxy: {
        host: "proxy.bytio.com",
        port: 8080,
        proxyAuth: `zone-${IPVanishAPI.ZONE_ID}-session-${this.sessionId}:${IPVanishAPI.API_KEY}`
      },
      rejectUnauthorized: false,
      keepAlive: true,
      timeout: IPVanishAPI.TIMEOUT
    });

    return {
      httpsAgent: tunnelAgent,
      proxy: undefined // Desactivamos el proxy de axios ya que usamos tunnel
    };
  }

  private async makeRequest(config: AxiosRequestConfig, retryCount = 0): Promise<AxiosResponse> {
    try {
      const requestConfig: AxiosRequestConfig = {
        ...config,
        ...this.getProxyConfig(),
        headers: {
          ...this.headers,
          ...config.headers
        },
        timeout: IPVanishAPI.TIMEOUT,
        maxRedirects: 5,
        validateStatus: (status) => status < 500
      };

      const response = await axios(requestConfig);
      return response;
    } catch (error: any) {
      console.error(`Intento ${retryCount + 1}/${IPVanishAPI.MAX_RETRIES} falló:`, error.message);

      if (error.response?.status === 404 || error.message.includes('Socket is closed') || error.message.includes('SSL routines')) {
        console.log('Sesión no disponible o error SSL, generando nueva sesión...');
        this.sessionId = this.generateSessionId();
        
        if (retryCount < IPVanishAPI.MAX_RETRIES) {
          console.log(`Reintentando (${retryCount + 1}/${IPVanishAPI.MAX_RETRIES})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return this.makeRequest(config, retryCount + 1);
        }
      }
      
      throw error;
    }
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

  private async login(username: string, password: string): Promise<LoginResponse> {
    try {
      console.log('🔄 Iniciando solicitud de login a IPVanish...');
      
      const loginData = {
        api_key: this.apiKey,
        client: this.clientInfo.client,
        os: this.clientInfo.os,
        password: password,
        username: username,
        uuid: this.generateUUID()
      };

      console.log('📝 Datos de solicitud:', {
        url: `${this.baseUrl}/login`,
        body: {
          ...loginData,
          password: '********'
        }
      });

      const response = await this.makeRequest({
        method: 'post',
        url: `${this.baseUrl}/login`,
        data: loginData
      });

      console.log('📨 Respuesta recibida:', {
        status: response.status,
        statusText: response.statusText
      });

      if (response.data && response.data.email) {
        return {
          success: true,
          data: {
            email: response.data.email,
            accountType: response.data.account_type,
            expiryDate: response.data.sub_end_epoch
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
      console.error('❌ Error en la solicitud:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      return {
        success: false,
        error: {
          code: error.response?.data?.code || 'ERROR',
          message: error.response?.data?.message || error.message,
          details: error.response?.data || error.toString()
        }
      };
    }
  }
} 