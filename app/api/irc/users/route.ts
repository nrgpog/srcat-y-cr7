import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import dbConnect from '../../../utils/mongodb';
import mongoose from 'mongoose';

// Definir el esquema aquí para asegurar que esté registrado
const ircUserSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
  },
  isConnected: {
    type: Boolean,
    default: false,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  userColor: {
    type: String,
    required: true,
  },
  connectionStatus: {
    type: String,
    enum: ['active', 'idle', 'disconnected'],
    default: 'active'
  }
});

// Registrar el modelo si no existe
const IrcUser = mongoose.models.IrcUser || mongoose.model('IrcUser', ircUserSchema);

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    // Aumentamos el tiempo de inactividad a 4 horas para mayor persistencia
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
    
    // Solo desconectar usuarios realmente inactivos y en estado idle
    await IrcUser.updateMany(
      { 
        lastSeen: { $lt: fourHoursAgo },
        connectionStatus: 'idle'
      },
      { 
        $set: { 
          isConnected: false,
          connectionStatus: 'disconnected'
        }
      }
    );

    // Actualizar lastSeen del usuario actual sin cambiar su estado de conexión
    const currentUser = await IrcUser.findOne({ userId: session.user.id });
    
    if (currentUser) {
      // Si el usuario existe, solo actualizamos lastSeen
      currentUser.lastSeen = new Date();
      if (currentUser.connectionStatus === 'disconnected') {
        currentUser.connectionStatus = 'active';
        currentUser.isConnected = true;
      }
      await currentUser.save();
    }

    // Obtener usuarios conectados con sus colores
    const users = await IrcUser.find({ 
      isConnected: true,
      connectionStatus: { $ne: 'disconnected' }
    })
    .select('userId username userColor')
    .lean();

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error getting IRC users:', error);
    return NextResponse.json(
      { error: 'Error al obtener los usuarios' },
      { status: 500 }
    );
  }
} 