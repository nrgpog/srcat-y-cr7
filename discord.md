discord_example:
const DiscordAPI = require('./discordApi');

const ZONE_ID = "E5F623E6";
const API_KEY = "7490ACB4C335445BA08A9AE62E85AE03";

async function main() {
    const discord = new DiscordAPI();
    console.log('🚀 Iniciando checker de códigos promocionales de Discord...');
    
    console.log('🔒 Configurando proxy...');
    discord.setProxy(ZONE_ID, API_KEY);
    
    const promoCodes = [
        'Fa9ncvxXnFwYsbp3YKhEfnCN',
      

    ];

    try {
        for (const code of promoCodes) {
            const result = await discord.checkPromoCode(code);
            
            if (!result.success) {
                console.error('❌ Error al verificar código:', code);
                console.error('  Código:', result.error.code);
                console.error('  Mensaje:', result.error.message);
                if (result.error.details?.proxy) {
                    console.error('  Proxy usado:', result.error.details.proxy);
                }
                continue;
            }

            if (result.data.valid) {
                console.log('✅ Código válido:', code);
                console.log('📊 Detalles:', JSON.stringify(result.data.details, null, 2));
            } else {
                console.log('❌ Código inválido:', code);
                console.log('  Razón:', result.data.reason);
            }
        }
    } catch (error) {
        console.error('❌ Error en la aplicación:', error.message);
    }
}

main().catch(error => {
    console.error('💥 Error fatal en la aplicación:', {
        message: error.message,
        stack: error.stack
    });
}); 

discordApi:
const axios = require('axios');
const tunnel = require('tunnel');

class DiscordAPI {
    constructor(proxyConfig = null) {
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
        this.proxyConfig = proxyConfig;
    }

    setProxy(zoneId, apiKey) {
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

        console.log('🔒 Proxy configurado:', {
            host: this.proxyConfig.host,
            port: this.proxyConfig.port,
            username: this.proxyConfig.auth.username
        });
    }

    async checkPromoCode(promoCode) {
        try {
            console.log(`🔄 Verificando código promocional: ${promoCode}`);
            
            const axiosConfig = {
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
                        details: response.data
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

        } catch (error) {
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

module.exports = DiscordAPI; 