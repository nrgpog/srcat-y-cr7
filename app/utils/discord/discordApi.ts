import axios, { AxiosRequestConfig } from 'axios';
import tunnel from 'tunnel';

interface PromoCodeResponse {
  success: boolean;
  data?: {
    code: string;
    valid: boolean;
    giftDetails?: any;
    reason?: string;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export class DiscordAPI {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;
  private proxyConfig: any;

  constructor() {
    this.baseUrl = 'https://discord.com/api/v9';
    this.headers = {
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
    };
  }

  setProxy(zoneId: string, apiKey: string): void {
    const username = `zone-${zoneId}`;

    this.proxyConfig = {
      host: 'proxy.bytio.com',
      port: 8080,
      auth: {
        username: username,
        password: apiKey
      },
      protocol: 'http'
    };
  }

  async checkPromoCode(promoCode: string): Promise<PromoCodeResponse> {
    try {
      console.log(`🔄 Verificando código promocional: ${promoCode}`);
      
      const axiosConfig: AxiosRequestConfig = {
        headers: this.headers,
        timeout: 30000,
        validateStatus: function (status) {
          return status >= 200 && status < 500;
        }
      };

      if (this.proxyConfig) {
        const tunnelingAgent = tunnel.httpsOverHttp({
          proxy: {
            host: this.proxyConfig.host,
            port: this.proxyConfig.port,
            proxyAuth: `${this.proxyConfig.auth.username}:${this.proxyConfig.auth.password}`,
            headers: {
              'User-Agent': this.headers['User-Agent']
            }
          }
        });

        axiosConfig.httpsAgent = tunnelingAgent;
        axiosConfig.proxy = false;
      }

      const response = await axios.get(
        `${this.baseUrl}/entitlements/gift-codes/${promoCode}?country_code=ES&with_application=false&with_subscription_plan=true`,
        axiosConfig
      );

      if (response.status === 200) {
        return {
          success: true,
          data: {
            code: promoCode,
            valid: true,
            giftDetails: response.data
          }
        };
      } else if (response.status === 404) {
        return {
          success: true,
          data: {
            code: promoCode,
            valid: false,
            reason: 'Código inválido o expirado'
          }
        };
      }

      return {
        success: false,
        error: {
          code: 'INVALID_RESPONSE',
          message: 'Respuesta inesperada del servidor',
          details: response.data
        }
      };

    } catch (error: any) {
      const errorDetails = {
        message: error.message,
        code: error.code,
        response: {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        },
        proxy: this.proxyConfig ? {
          host: this.proxyConfig.host,
          port: this.proxyConfig.port,
          username: this.proxyConfig.auth.username
        } : null
      };

      return {
        success: false,
        error: {
          code: error.response?.data?.code || error.code || 'ERROR',
          message: error.message,
          details: errorDetails
        }
      };
    }
  }
} 