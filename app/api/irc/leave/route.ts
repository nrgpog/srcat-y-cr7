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

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !session?.user?.name) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    // Desconectar usuario
    await IrcUser.updateOne(
      { userId: session.user.id },
      { isConnected: false }
    );

    // Crear mensaje de sistema
    const newMessage = new IrcMessage({
      userId: 'system',
      username: 'System',
      message: `${session.user.name} ha salido del canal`,
    });
    await newMessage.save();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error leaving IRC:', error);
    return NextResponse.json(
      { error: 'Error al salir del IRC' },
      { status: 500 }
    );
  }
} 