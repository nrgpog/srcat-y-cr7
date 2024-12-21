import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '../../../utils/mongodb';
import User from '../../../models/User';

export async function POST(req: Request) {
  try {
    console.log('🔄 Iniciando proceso de registro...');
    
    await dbConnect();
    console.log('✅ Conexión a MongoDB establecida');
    
    const { name, email, password } = await req.json();
    console.log('📝 Datos recibidos:', { name, email, password: '********' });

    // Validaciones
    if (!email || !password) {
      console.log('❌ Error: Email y contraseña son requeridos');
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    console.log('🔍 Verificando si el usuario ya existe...');
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      console.log('❌ Error: Email ya registrado');
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      );
    }

    // Hash password
    console.log('🔒 Hasheando contraseña...');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear usuario
    console.log('👤 Creando nuevo usuario...');
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    console.log('✅ Usuario creado exitosamente');
    return NextResponse.json(
      { message: 'Usuario creado exitosamente' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('❌ Error en registro:', error);
    
    if (error.message.includes('MONGO_URL')) {
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al crear usuario', details: error.message },
      { status: 500 }
    );
  }
}
