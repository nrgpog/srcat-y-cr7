import { NextResponse } from 'next/server';
import { DiscordAPI } from '../../../utils/discord/discordApi';
import { encrypt, decrypt } from '../../../utils/encryption';

// Configuración optimizada para maximizar códigos verificados
const CONFIG = {
  BATCH_SIZE: 1,           // Un código a la vez para evitar conflictos de proxy
  CODE_TIMEOUT: 10000,     // 10 segundos por código
  MAX_RETRIES: 1,          // 1 reintento para ahorrar tiempo
  RETRY_DELAY: 1000,       // 1 segundo entre reintentos
  TOTAL_TIMEOUT: 55000,    // 55 segundos (dejando 5s de margen para Vercel)
  CODE_DELAY: 500,         // Delay mínimo entre códigos
  MAX_CODES_PER_CHUNK: 15, // Máximo de códigos por chunk para asegurar completar en tiempo
  MIN_CODES_PER_CHUNK: 5   // Mínimo de códigos por chunk para eficiencia
};

const ZONE_ID = "E5F623E6";
const API_KEY = "7490ACB4C335445BA08A9AE62E85AE03";

interface ChunkInfo {
  chunkIndex: number;
  totalChunks: number;
  codesInChunk: number;
  totalCodes: number;
  startIndex: number;
  endIndex: number;
}

function calculateChunks(codes: string[]): ChunkInfo[] {
  const totalCodes = codes.length;
  const estimatedTimePerCode = CONFIG.CODE_TIMEOUT + CONFIG.RETRY_DELAY + CONFIG.CODE_DELAY;
  const maxCodesPerRequest = Math.floor(CONFIG.TOTAL_TIMEOUT / estimatedTimePerCode);
  const codesPerChunk = Math.min(
    Math.max(CONFIG.MIN_CODES_PER_CHUNK, maxCodesPerRequest),
    CONFIG.MAX_CODES_PER_CHUNK
  );
  
  const totalChunks = Math.ceil(totalCodes / codesPerChunk);
  
  return Array.from({ length: totalChunks }, (_, index) => {
    const startIndex = index * codesPerChunk;
    const endIndex = Math.min(startIndex + codesPerChunk, totalCodes);
    return {
      chunkIndex: index,
      totalChunks,
      codesInChunk: endIndex - startIndex,
      totalCodes,
      startIndex,
      endIndex
    };
  });
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function checkCodeWithRetry(
  code: string,
  retryCount = 0
): Promise<any> {
  try {
    const api = new DiscordAPI();
    api.setProxy(ZONE_ID, API_KEY);
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), CONFIG.CODE_TIMEOUT);
    });

    const result = await Promise.race([
      api.checkPromoCode(code),
      timeoutPromise
    ]);

    return {
      code,
      success: true,
      details: result.data
    };
  } catch (error: any) {
    if (retryCount < CONFIG.MAX_RETRIES) {
      await sleep(CONFIG.RETRY_DELAY);
      return checkCodeWithRetry(code, retryCount + 1);
    }

    return {
      code,
      success: false,
      error: error.message === 'Timeout' ? 
        `Tiempo de espera agotado después de ${retryCount + 1} intentos` : 
        error.message || 'Error al verificar el código'
    };
  }
}

interface DiscordGiftDetails {
  store_listing: {
    sku: {
      name: string;
    };
  };
  subscription_plan: {
    name: string;
    price: number;
    currency: string;
  };
  uses: number;
  max_uses: number;
  sku_id: string;
  application_id: string;
  redeemed: boolean;
  expires_at: string;
  promotion: {
    inbound_header_text: string;
    inbound_body_text: string;
    inbound_restricted_countries: string[];
    start_date: string;
    end_date: string;
  };
  subscription_trial: {
    id: string;
  };
  batch_id: string;
  subscription_plan_id: string;
  flags: number;
}

interface DiscordResponse {
  success: boolean;
  error?: string;
  data?: {
    code: string;
    valid: boolean;
    giftDetails?: DiscordGiftDetails;
    reason?: string;
  };
}

export async function POST(req: Request) {
  try {
    const { codes } = await req.json();
    
    // Si es un array de códigos, procesar como chunk
    if (Array.isArray(codes)) {
      const chunks = calculateChunks(codes);
      return NextResponse.json({ 
        type: 'chunks',
        chunks,
        message: `Se procesarán ${codes.length} códigos en ${chunks.length} solicitudes separadas.`
      });
    }
    
    // Si es un código individual, procesarlo directamente
    const code = codes;
    const api = new DiscordAPI();
    api.setProxy(ZONE_ID, API_KEY);
    
    const response = await api.checkPromoCode(code) as DiscordResponse;
    
    if (response.success && response.data?.giftDetails) {
      return NextResponse.json({
        code: code,
        details: {
          valid: true,
          giftDetails: response.data.giftDetails
        }
      });
    } else {
      return NextResponse.json({
        code: code,
        details: {
          valid: false,
          reason: response.error || 'Código inválido'
        }
      });
    }
  } catch (error: any) {
    return NextResponse.json({
      code: '',
      details: {
        valid: false,
        reason: error.message || 'Error al verificar el código'
      }
    });
  }
} 