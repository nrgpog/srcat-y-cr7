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
    
    return NextResponse.json({
      isConnected: !!user?.isConnected
    });
  } catch (error) {
    console.error('Error checking IRC status:', error);
    return NextResponse.json(
      { error: 'Error al verificar el estado del IRC' },
      { status: 500 }
    );
  }
} 