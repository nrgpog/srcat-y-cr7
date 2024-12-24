import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import dbConnect from '../../../utils/mongodb';
import IrcUser from '../../../models/IrcUser';
import IrcMessage from '../../../models/IrcMessage';

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
    
    // Buscar o crear usuario IRC
    let ircUser = await IrcUser.findOne({ userId: session.user.id });
    
    if (!ircUser) {
      // Lista de colores disponibles
      const colors = [
        '#FF4136', '#FF851B', '#FFDC00', '#2ECC40', '#0074D9',
        '#B10DC9', '#F012BE', '#01FF70', '#7FDBFF', '#FF4081',
        '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#00BCD4'
      ];

      // Obtener colores ya usados
      const usedColors = await IrcUser.distinct('userColor');
      
      // Filtrar colores disponibles
      const availableColors = colors.filter(color => !usedColors.includes(color));
      
      // Si todos los colores están usados, reutilizar la lista completa
      const selectedColor = availableColors.length > 0 
        ? availableColors[Math.floor(Math.random() * availableColors.length)]
        : colors[Math.floor(Math.random() * colors.length)];

      ircUser = await IrcUser.create({
        userId: session.user.id,
        username: session.user.name,
        isConnected: true,
        userColor: selectedColor
      });

      // Mensaje simple cuando un usuario se une
      await IrcMessage.create({
        userId: session.user.id,
        username: session.user.name,
        message: `se unió al IRC`,
        userColor: selectedColor
      });
    } else {
      // Si el usuario ya existe, asegurarnos de que esté conectado
      ircUser.isConnected = true;
      ircUser.lastSeen = new Date();
      await ircUser.save();

      // Solo enviar mensaje si realmente estaba desconectado antes
      const wasDisconnected = await IrcUser.findOne({
        userId: session.user.id,
        isConnected: false
      });

      if (wasDisconnected) {
        await IrcMessage.create({
          userId: session.user.id,
          username: session.user.name,
          message: `se unió al IRC`,
          userColor: ircUser.userColor
        });
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error joining IRC:', error);
    return NextResponse.json(
      { error: 'Error al unirse al IRC' },
      { status: 500 }
    );
  }
} 