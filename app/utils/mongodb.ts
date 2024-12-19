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
  console.error('❌ Error: No se pudo encontrar MONGO_URL en las variables de entorno');
  throw new Error('No se pudo encontrar MONGO_URL en las variables de entorno');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  try {
    console.log('🔄 Iniciando conexión a MongoDB...');
    
    if (cached.conn) {
      console.log('✅ Usando conexión existente a MongoDB');
      return cached.conn;
    }

    if (!cached.promise) {
      const opts = {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 60000,
        family: 4,
        connectTimeoutMS: 30000,
        retryWrites: true,
        retryReads: true,
      };

      console.log('🔌 Estableciendo nueva conexión a MongoDB...');
      console.log('📡 Intentando resolver DNS...');
      
      cached.promise = mongoose.connect(MONGO_URL, opts)
        .then((mongoose) => {
          console.log('✅ Conexión a MongoDB establecida exitosamente');
          return mongoose;
        })
        .catch((error) => {
          console.error('❌ Error al conectar:', error);
          if (error.name === 'MongooseServerSelectionError') {
            throw new Error('No se pudo conectar al servidor de MongoDB. Por favor, verifica tu conexión a internet y la URL de conexión.');
          }
          throw error;
        });
    }

    try {
      cached.conn = await cached.promise;
    } catch (e) {
      console.error('❌ Error al conectar con MongoDB:', e);
      cached.promise = null;
      throw e;
    }

    return cached.conn;
  } catch (error) {
    console.error('❌ Error en dbConnect:', error);
    throw new Error(`Error al conectar con MongoDB: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
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
