// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from 'bcryptjs';
import dbConnect from '../../../utils/mongodb';
import User from '../../../models/User';
import { JWT } from 'next-auth/jwt';
import { Session } from 'next-auth';

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "identify email",
        },
      },
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          console.log('🔄 Iniciando autorización...');
          await dbConnect();

          if (!credentials?.email || !credentials?.password) {
            throw new Error('Por favor ingresa email y contraseña');
          }

          const user = await User.findOne({ email: credentials.email });

          if (!user) {
            throw new Error('Usuario no encontrado');
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);

          if (!isValid) {
            throw new Error('Contraseña incorrecta');
          }

          console.log('✅ Autorización exitosa');
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error('❌ Error en autorización:', error);
          throw error;
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user: any }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      console.log('🔄 Redirigiendo...', { url, baseUrl, env: process.env.NODE_ENV });
      
      // Usar NEXTAUTH_URL si está definido, de lo contrario usar baseUrl
      const effectiveBaseUrl = process.env.NEXTAUTH_URL || baseUrl;
      console.log('📍 URL base efectiva:', effectiveBaseUrl);
      
      // Si la URL es relativa, convertirla a absoluta
      if (url.startsWith('/')) {
        return `${effectiveBaseUrl}${url}`;
      }
      
      // Si la URL es del mismo dominio que la URL base efectiva, permitirla
      if (url.startsWith(effectiveBaseUrl)) {
        return url;
      }
      
      // Si estamos en desarrollo y la URL es localhost, permitirla
      if (process.env.NODE_ENV === 'development' && url.includes('localhost')) {
        return url;
      }
      
      // Si estamos en producción y la URL es de Replit, permitirla
      if (process.env.NODE_ENV === 'production' && url.includes('.replit.dev')) {
        return url;
      }
      
      // Por defecto, redirigir a la página principal
      return effectiveBaseUrl;
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
