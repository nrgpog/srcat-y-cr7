import crypto from 'crypto';

// Asegurarnos de que la clave tenga el tamaño correcto (32 bytes = 256 bits)
const getEncryptionKey = () => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    console.error('⚠️ ENCRYPTION_KEY no encontrada en variables de entorno');
    // Generar una clave temporal para desarrollo
    return crypto.randomBytes(32).toString('hex');
  }
  
  // Asegurarnos de que la clave tenga el tamaño correcto
  const keyBuffer = Buffer.alloc(32);
  const tempBuffer = Buffer.from(key, 'hex');
  tempBuffer.copy(keyBuffer);
  if (keyBuffer.length !== 32) {
    console.error('⚠️ ENCRYPTION_KEY debe ser de 32 bytes');
    return crypto.randomBytes(32).toString('hex');
  }
  
  console.log('🔑 Usando clave de encriptación configurada');
  return key;
};

const ENCRYPTION_KEY = getEncryptionKey();
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = Buffer.alloc(32);
    const tempKey = Buffer.from(ENCRYPTION_KEY, 'hex');
    tempKey.copy(key);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    const encrypted = cipher.update(text, 'utf8', 'hex');
    const final = cipher.final('hex');
    const authTag = cipher.getAuthTag();
    
    // Formato: iv:authTag:encrypted+final
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted + final;
  } catch (error) {
    console.error('❌ Error en encriptación:', error);
    console.error('Texto a encriptar:', text);
    console.error('Clave usada:', ENCRYPTION_KEY);
    throw error;
  }
}

export function decrypt(text: string): string {
  try {
    const [ivHex, authTagHex, encryptedHex] = text.split(':');
    
    if (!ivHex || !authTagHex || !encryptedHex) {
      throw new Error('Formato de texto cifrado inválido');
    }
    
    const key = Buffer.alloc(32);
    const tempKey = Buffer.from(ENCRYPTION_KEY, 'hex');
    tempKey.copy(key);
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    const decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    const final = decipher.final('utf8');
    
    return decrypted + final;
  } catch (error) {
    console.error('❌ Error en desencriptación:', error);
    console.error('Datos recibidos:', text);
    console.error('Clave usada:', ENCRYPTION_KEY);
    throw error;
  }
} 