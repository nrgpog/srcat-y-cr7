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
      ircUser = await IrcUser.create({
        userId: session.user.id,
        username: session.user.name,
        isConnected: true,
      });

      // Crear mensaje de sistema cuando un usuario se une
      await IrcMessage.create({
        userId: 'system',
        username: 'System',
        message: `${session.user.name} se ha unido al canal`,
      });
    } else {
      ircUser.isConnected = true;
      ircUser.lastSeen = new Date();
      await ircUser.save();
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