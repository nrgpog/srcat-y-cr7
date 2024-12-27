import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';

const DISCORD_INVITE = 'discord.gg/aeolouscm';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      inviteUrl: `https://${DISCORD_INVITE}`
    });

  } catch (error) {
    console.error('Error al obtener la invitación:', error);
    return NextResponse.json(
      { error: 'Error al procesar la invitación' },
      { status: 500 }
    );
  }
} 