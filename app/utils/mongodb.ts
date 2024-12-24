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
let isReconnecting = false;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
      maxPoolSize: 10,
      retryWrites: true,
      retryReads: true,
      connectTimeoutMS: 10000,
    };

    if (typeof MONGO_URL !== 'string') {
      throw new Error('MONGO_URL debe ser una cadena de texto válida');
    }

    cached.promise = mongoose.connect(MONGO_URL, opts)
      .then((mongoose) => {
        isReconnecting = false;
        return mongoose;
      })
      .catch((error) => {
        cached.promise = null;
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
  if (!isReconnecting) {
    console.error('❌ Error de Mongoose:', err);
    isReconnecting = true;
    cached.promise = null;
    setTimeout(dbConnect, 5000);
  }
});

mongoose.connection.on('disconnected', () => {
  if (!isReconnecting) {
    console.log('⚠️ Mongoose desconectado de MongoDB');
    isReconnecting = true;
    cached.promise = null;
    setTimeout(dbConnect, 5000);
  }
});

process.on('SIGINT', async () => {
  if (cached.conn) {
    await mongoose.connection.close();
    process.exit(0);
  }
});

export default dbConnect;
