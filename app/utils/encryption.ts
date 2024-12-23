// Función para convertir string a ArrayBuffer
const str2ab = (str: string) => {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

// Función para convertir ArrayBuffer a string
const ab2str = (buf: ArrayBuffer) => {
  return String.fromCharCode.apply(null, Array.from(new Uint8Array(buf)));
}

// Obtener la clave de encriptación
const getEncryptionKey = async () => {
  const key = process.env.ENCRYPTION_KEY || 'default-key-that-is-32-bytes-long!!';
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
};

// Función para generar IV aleatorio
const generateIV = () => {
  return crypto.getRandomValues(new Uint8Array(12));
};

// Encriptar datos
export async function encrypt(text: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const iv = generateIV();
    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      data
    );

    // Combinar IV y datos encriptados
    const encryptedArray = new Uint8Array(encrypted);
    const combined = new Uint8Array(iv.length + encryptedArray.length);
    combined.set(iv);
    combined.set(encryptedArray, iv.length);

    // Convertir a string base64
    return btoa(ab2str(combined.buffer));
  } catch (error) {
    console.error('Error al encriptar:', error);
    throw new Error('Error al encriptar los datos');
  }
}

// Desencriptar datos
export async function decrypt(encryptedText: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const decoder = new TextDecoder();

    // Convertir de base64 a ArrayBuffer
    const combined = new Uint8Array(str2ab(atob(encryptedText)));

    // Separar IV y datos encriptados
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      data
    );

    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Error al desencriptar:', error);
    throw new Error('Error al desencriptar los datos');
  }
} 