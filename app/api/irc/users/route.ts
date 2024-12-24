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
    
    // Obtener todos los usuarios que se han unido alguna vez
    const users = await IrcUser.find({})
      .sort({ joinedAt: -1 }) // Ordenar por fecha de unión
      .select('userId username isConnected joinedAt lastSeen userColor connectionStatus')
      .lean();
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error getting IRC users:', error);
    return NextResponse.json(
      { error: 'Error al obtener usuarios del IRC' },
      { status: 500 }
    );
  }
} 