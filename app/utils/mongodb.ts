// src/utils/mongodb.ts
import mongoose from 'mongoose';
import dns from 'dns';

// Configurar las opciones de DNS para usar IPv4
dns.setDefaultResultOrder('ipv4first');

declare global {
  var mongoose: {
    conn: any;
    promise: any;
  };
}

const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URL) {
  throw new Error(
    'Por favor define la variable de entorno MONGO_URL dentro de .env.local'
  );
}

interface CachedConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

let cached: CachedConnection = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    console.log('🔄 Usando conexión a MongoDB existente');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    console.log('📡 Intentando resolver DNS...');

    if (typeof MONGO_URL !== 'string') {
      throw new Error('MONGO_URL debe ser una cadena de texto válida');
    }

    cached.promise = mongoose.connect(MONGO_URL, opts)
      .then((mongoose) => {
        console.log('✅ Conexión a MongoDB establecida exitosamente');
        return mongoose;
      })
      .catch((error) => {
        console.error('❌ Error al conectar con MongoDB:', error);
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose conectado a MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Error de Mongoose:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose desconectado de MongoDB');
});

process.on('SIGINT', async () => {
  if (cached.conn) {
    await mongoose.connection.close();
    console.log('MongoDB desconectado debido a la terminación de la aplicación');
    process.exit(0);
  }
});

export default dbConnect;
