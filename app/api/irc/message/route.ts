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
  userColor: {
    type: String,
    required: true,
  }
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

    // Obtener los colores de los usuarios de manera eficiente
    const userIds = Array.from(new Set(messages.map(msg => msg.userId).filter(id => id !== 'system')));
    
    // Asignar colores a usuarios que no los tengan
    const colors = [
      '#FF4136', '#FF851B', '#FFDC00', '#2ECC40', '#0074D9',
      '#B10DC9', '#F012BE', '#01FF70', '#7FDBFF', '#FF4081',
      '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#00BCD4'
    ];

    // Obtener usuarios existentes
    const users = await IrcUser.find({ userId: { $in: userIds } });
    
    // Identificar usuarios sin color
    const usersWithoutColor = users.filter(user => !user.userColor);
    
    if (usersWithoutColor.length > 0) {
      // Obtener colores ya usados
      const usedColors = users.map(user => user.userColor).filter(Boolean);
      
      // Asignar colores a usuarios que no los tengan
      for (const user of usersWithoutColor) {
        // Filtrar colores disponibles
        const availableColors = colors.filter(color => !usedColors.includes(color));
        
        // Seleccionar un color
        const selectedColor = availableColors.length > 0 
          ? availableColors[Math.floor(Math.random() * availableColors.length)]
          : colors[Math.floor(Math.random() * colors.length)];
        
        // Actualizar usuario con el nuevo color
        user.userColor = selectedColor;
        await user.save();
        
        // Agregar el color usado a la lista
        usedColors.push(selectedColor);
      }
    }

    // Obtener los usuarios actualizados
    const updatedUsers = await IrcUser.find({ userId: { $in: userIds } })
      .select('userId userColor')
      .lean();

    // Crear un mapa de colores por userId
    const userColors = updatedUsers.reduce((acc, user) => {
      acc[user.userId] = user.userColor;
      return acc;
    }, {} as Record<string, string>);

    // Agregar los colores a los mensajes
    const messagesWithColors = messages.map(msg => ({
      ...msg,
      userColor: msg.userId === 'system' ? null : (userColors[msg.userId] || '#FF4136')
    }));

    return NextResponse.json({
      messages: messagesWithColors.reverse()
    });
  } catch (error) {
    console.error('Error getting IRC messages:', error);
    return NextResponse.json(
      { error: 'Error al obtener los mensajes' },
      { status: 500 }
    );
  }
} 