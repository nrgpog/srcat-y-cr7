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
    
    // Obtener usuarios conectados
    // Desconectar usuarios inactivos por más de 5 minutos
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    await IrcUser.updateMany(
      { 
        lastSeen: { $lt: fiveMinutesAgo },
        isConnected: true
      },
      { 
        $set: { isConnected: false }
      }
    );

    const users = await IrcUser.find({ isConnected: true })
      .select('userId username')
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