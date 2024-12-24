import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import dbConnect from '../../../utils/mongodb';
import IrcUser from '../../../models/IrcUser';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ isConnected: false }, { status: 401 });
    }

    await dbConnect();
    
    const user = await IrcUser.findOne({ userId: session.user.id });
    
    if (!user) {
      return NextResponse.json({ isConnected: false });
    }

    // Si el usuario está activo o idle, considerarlo conectado
    const isConnected = user.isConnected && user.connectionStatus !== 'disconnected';
    
    // Si está conectado, actualizar lastSeen
    if (isConnected) {
      user.lastSeen = new Date();
      await user.save();
    }

    return NextResponse.json({
      isConnected,
      connectionStatus: user.connectionStatus
    });
  } catch (error) {
    console.error('Error checking IRC status:', error);
    return NextResponse.json(
      { error: 'Error al verificar el estado del IRC' },
      { status: 500 }
    );
  }
} 