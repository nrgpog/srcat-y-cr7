import axios from 'axios-https-proxy-fix';
import crypto from 'crypto';
import FormData from 'form-data';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

interface SteamAuthData {
  steamId: string;
  accountName: string;
  oauthToken: string;
  wgtoken: string;
  wgtokenSecure: string;
}

interface LoginResponse {
  success: boolean;
  data?: {
    mod?: any;
    exp?: any;
    timestamp?: any;
    total?: number;
    list?: string[];
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Agregar interface para la respuesta de makeRequest
interface RequestResponse {
  data: any;
  response?: {
    status: number;
    data: any;
  };
}

interface AccountInfoResponse {
  success: boolean;
  data?: {
    status: string;
    balance: string;
    games?: {
      total: number;
      list: string[];
    };
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

interface CheckAccountResponse {
  success: boolean;
  details?: {
    username: string;
    password: string;
    status: string;
    balance: string;
    games?: {
      total: number;
      list: string[];
    };
  };
  error?: string;
}

export class SteamAPI {
  private baseUrls: Record<string, string>;
  private headers: Record<string, string>;
  private authData?: SteamAuthData;
  private steamId?: string;
  private sessionId: string;
  private static readonly ZONE_ID = "E5F623E6";
  private static readonly API_KEY = "7490ACB4C335445BA08A9AE62E85AE03";

  constructor() {
    this.baseUrls = {
      chat: 'https://steam-chat.com',
      store: 'https://store.steampowered.com',
      community: 'https://steamcommunity.com'
    };
    
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Device': 'f5bf4f66306d8cf2cb95d342c02a5941',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive'
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
          username: `zone-${SteamAPI.ZONE_ID}-session-${this.sessionId}`,
          password: SteamAPI.API_KEY
        }
      }
    };
  }

  private async makeRequest(config: any): Promise<RequestResponse> {
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

  private async getRSAKey(username: string): Promise<{
    success: boolean;
    data?: {
      mod: string;
      exp: string;
      timestamp: string;
    };
    error?: {
      code: string;
      message: string;
      details?: any;
    };
  }> {
    try {
      const form = new FormData();
      form.append('donotcache', String(Date.now()));
      form.append('username', username);

      const response = await this.makeRequest({
        method: 'post',
        url: `${this.baseUrls.chat}/login/getrsakey/`,
        data: form,
        headers: {
          ...form.getHeaders(),
          'Host': 'steam-chat.com'
        }
      });

      if (!response.data.success || !response.data.publickey_mod || !response.data.publickey_exp) {
        throw new Error('Respuesta RSA inválida');
      }

      return {
        success: true,
        data: {
          mod: response.data.publickey_mod,
          exp: response.data.publickey_exp,
          timestamp: response.data.timestamp
        }
      };
    } catch (error) {
      return this.handleError('Error obteniendo clave RSA', error);
    }
  }

  private encryptPassword(password: string, mod: string, exp: string): string {
    const modulus = Buffer.from(mod, 'hex');
    const exponent = Buffer.from(exp, 'hex');
    const pemKey = this.createPublicKeyPEM(modulus, exponent);

    const encrypted = crypto.publicEncrypt(
      {
        key: pemKey,
        padding: crypto.constants.RSA_PKCS1_PADDING
      },
      Buffer.from(password)
    );

    return encrypted.toString('base64');
  }

  private createPublicKeyPEM(modulus: Buffer, exponent: Buffer): string {
    const rsaPublicKey = Buffer.concat([
      Buffer.from([0x30, 0x82, 0x01, 0x22, 0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86,
                  0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00, 0x03, 0x82, 0x01, 0x0f, 0x00]),
      Buffer.from([0x30, 0x82, 0x01, 0x0a, 0x02, 0x82, 0x01, 0x01, 0x00]),
      modulus,
      Buffer.from([0x02, 0x03]),
      exponent,
      Buffer.from([0x00])
    ]);

    return [
      '-----BEGIN PUBLIC KEY-----',
      rsaPublicKey.toString('base64').match(/.{1,64}/g)?.join('\n'),
      '-----END PUBLIC KEY-----'
    ].join('\n');
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const rsaResponse = await this.getRSAKey(username);
      if (!rsaResponse.success || !rsaResponse.data) {
        return rsaResponse as LoginResponse;
      }

      const { mod, exp, timestamp } = rsaResponse.data;
      const encryptedPassword = this.encryptPassword(password, mod, exp);
      const unixTime = Math.floor(Date.now() / 1000);

      const loginData = new URLSearchParams({
        donotcache: String(unixTime),
        password: encryptedPassword,
        username: username,
        twofactorcode: '',
        emailauth: '',
        loginfriendlyname: '',
        captchagid: '',
        captcha_text: '',
        emailsteamid: '',
        rsatimestamp: timestamp,
        remember_login: 'false',
        oauth_client_id: 'C1F110D6',
        mobile_chat_client: 'true'
      });

      const response = await this.makeRequest({
        method: 'post',
        url: `${this.baseUrls.chat}/login/dologin/`,
        data: loginData.toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (response.data.success) {
        this.steamId = response.data.steamid;
        const oauth = JSON.parse(response.data.oauth);
        this.authData = {
          steamId: oauth.steamid,
          accountName: oauth.account_name,
          oauthToken: oauth.oauth_token,
          wgtoken: oauth.wgtoken,
          wgtokenSecure: oauth.wgtoken_secure
        };

        return {
          success: true,
          data: response.data
        };
      }

      if (response.data.requires_twofactor || response.data.emailauth_needed) {
        return {
          success: false,
          error: {
            code: '2FA_REQUIRED',
            message: 'Se requiere autenticación de dos factores'
          }
        };
      }

      return {
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message: response.data.message || 'Error de inicio de sesión'
        }
      };

    } catch (error) {
      return this.handleError('Error en login', error);
    }
  }

  async getAccountInfo(): Promise<AccountInfoResponse> {
    if (!this.authData) {
      return {
        success: false,
        error: {
          code: 'NO_AUTH',
          message: 'No hay datos de autenticación disponibles'
        }
      };
    }

    try {
      const [accountResponse, gamesResponse] = await Promise.all([
        this.makeRequest({
          method: 'get',
          url: `${this.baseUrls.store}/account/`,
          headers: {
            'Cookie': [
              `steamLoginSecure=${this.authData.steamId}%7C%7C${this.authData.wgtokenSecure}`,
              `sessionid=${this.sessionId}`,
              `steamMachineAuth${this.authData.steamId}=${this.authData.wgtoken}`
            ].join('; '),
            'Referer': 'https://store.steampowered.com/',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
          }
        }),
        this.getGames()
      ]);

      // Extraer información de la cuenta usando regex
      const statusMatch = accountResponse.data.match(/account_manage_label">Status:[\s\S]*?>(.*?)<\/a/);
      const balanceMatch = accountResponse.data.match(/accountData price">(.*?)<\/div/);
      const walletMatch = accountResponse.data.match(/View my wallet <span class="account_name">(.*?)<\/span/);

      const status = statusMatch ? statusMatch[1].trim() : 'No disponible';
      const balance = balanceMatch ? balanceMatch[1].trim() : 
                     walletMatch ? walletMatch[1].trim() : 'No disponible';

      return {
        success: true,
        data: {
          status,
          balance,
          games: gamesResponse.success && gamesResponse.data ? gamesResponse.data : undefined
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ERROR',
          message: error instanceof Error ? error.message : 'Error desconocido',
          details: error
        }
      };
    }
  }

  async getGames(): Promise<{
    success: boolean;
    data?: {
      total: number;
      list: string[];
    };
    error?: {
      code: string;
      message: string;
      details?: any;
    };
  }> {
    if (!this.authData) {
      return {
        success: false,
        error: {
          code: 'NO_AUTH',
          message: 'No hay datos de autenticación disponibles'
        }
      };
    }

    try {
      console.log('🔄 Obteniendo lista de juegos...');
      const response = await this.makeRequest({
        method: 'get',
        url: `${this.baseUrls.community}/profiles/${this.authData.steamId}/games?tab=all`,
        headers: {
          'Cookie': [
            `steamLoginSecure=${this.authData.steamId}%7C%7C${this.authData.wgtokenSecure}`,
            `sessionid=${this.sessionId}`,
            `steamMachineAuth${this.authData.steamId}=${this.authData.wgtoken}`
          ].join('; '),
          'Referer': 'https://steamcommunity.com/',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        }
      });

      console.log('📨 Respuesta de juegos recibida');
      const games = this.extractAllBetween(response.data, ';name&quot;:&quot;', '&quot;');
      console.log('🎮 Juegos encontrados:', games);
      
      return {
        success: true,
        data: {
          total: games.length,
          list: games
        }
      };
    } catch (error) {
      console.error('❌ Error obteniendo juegos:', error);
      return this.handleError('Error obteniendo juegos', error);
    }
  }

  private extractAllBetween(str: string, start: string, end: string): string[] {
    const results: string[] = [];
    let pos = 0;
    while ((pos = str.indexOf(start, pos)) !== -1) {
      const endPos = str.indexOf(end, pos + start.length);
      if (endPos === -1) break;
      results.push(str.substring(pos + start.length, endPos));
      pos = endPos + end.length;
    }
    return results;
  }

  private handleError(context: string, error: any) {
    return {
      success: false,
      error: {
        code: error.response?.status || 'ERROR',
        message: error.message,
        details: error.response?.data
      }
    };
  }

  async checkAccount(username: string, password: string): Promise<CheckAccountResponse> {
    try {
      console.log('🔄 Verificando cuenta Steam...');
      const loginResult = await this.login(username, password);

      if (!loginResult.success) {
        return {
          success: false,
          error: loginResult.error?.message || 'Error de inicio de sesión'
        };
      }

      if (loginResult.error?.code === '2FA_REQUIRED') {
        return {
          success: true,
          details: {
            username,
            password,
            status: '2FA_REQUIRED',
            balance: 'N/A'
          }
        };
      }

      const accountInfo = await this.getAccountInfo();
      
      if (!accountInfo.success || !accountInfo.data) {
        return {
          success: false,
          error: accountInfo.error?.message || 'Error al obtener información de la cuenta'
        };
      }

      return {
        success: true,
        details: {
          username,
          password,
          status: accountInfo.data.status,
          balance: accountInfo.data.balance,
          games: accountInfo.data.games
        }
      };

    } catch (error: any) {
      console.error('❌ Error verificando cuenta:', error);
      return {
        success: false,
        error: error.message || 'Error desconocido al verificar la cuenta'
      };
    }
  }
} 