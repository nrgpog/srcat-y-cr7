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
    
    // Aumentamos el tiempo de inactividad a 30 minutos
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    await IrcUser.updateMany(
      { 
        lastSeen: { $lt: thirtyMinutesAgo },
        isConnected: true
      },
      { 
        $set: { isConnected: false }
      }
    );

    // Actualizar lastSeen del usuario actual
    await IrcUser.updateOne(
      { userId: session.user.id },
      { 
        $set: { lastSeen: new Date() }
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