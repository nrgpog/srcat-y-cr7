import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { card } = await request.json();

    const response = await fetch(`https://xchecker.cc/api.php?cc=${card}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
