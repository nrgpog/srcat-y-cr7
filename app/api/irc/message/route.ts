import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import dbConnect from '../../../utils/mongodb';
import mongoose from 'mongoose';

// Definir el esquema aquí para asegurar que esté registrado
const ircMessageSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

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

// Registrar los modelos si no existen
const IrcMessage = mongoose.models.IrcMessage || mongoose.model('IrcMessage', ircMessageSchema);
const IrcUser = mongoose.models.IrcUser || mongoose.model('IrcUser', ircUserSchema);

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !session?.user?.name) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    // Verificar que el usuario está conectado
    const ircUser = await IrcUser.findOne({ 
      userId: session.user.id,
      isConnected: true
    });

    if (!ircUser) {
      return NextResponse.json(
        { error: 'Debes estar conectado al IRC para enviar mensajes' },
        { status: 403 }
      );
    }

    const { message } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Mensaje inválido' },
        { status: 400 }
      );
    }

    // Crear el mensaje
    const newMessage = new IrcMessage({
      userId: session.user.id,
      username: session.user.name,
      message: message.slice(0, 500), // Limitar longitud del mensaje
    });
    await newMessage.save();

    // Actualizar última actividad del usuario
    ircUser.lastSeen = new Date();
    await ircUser.save();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending IRC message:', error);
    return NextResponse.json(
      { error: 'Error al enviar el mensaje' },
      { status: 500 }
    );
  }
}

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
    
    // Obtener los últimos 100 mensajes
    const messages = await IrcMessage.find()
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({
      messages: messages.reverse()
    });
  } catch (error) {
    console.error('Error getting IRC messages:', error);
    return NextResponse.json(
      { error: 'Error al obtener los mensajes' },
      { status: 500 }
    );
  }
} 