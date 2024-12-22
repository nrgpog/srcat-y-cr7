import type { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from 'bcryptjs';
import dbConnect from '../app/utils/mongodb';
import User from '../app/models/User';

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

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

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error('Error en autorización:', error);
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
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as ExtendedUser).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Obtener la URL base correcta según el entorno
      const productionUrl = "https://smaliidkoo.vercel.app";
      const effectiveBaseUrl = process.env.NODE_ENV === "production" ? productionUrl : baseUrl;

      // Si la URL comienza con una barra, agrégala a la URL base
      if (url.startsWith("/")) {
        return `${effectiveBaseUrl}${url}`;
      }

      // Si la URL ya es una URL completa
      if (url.startsWith("http")) {
        const urlObj = new URL(url);
        // Lista de dominios permitidos
        const allowedDomains = [
          "localhost",
          "smaliidkoo.vercel.app",
          "vercel.app"
        ];

        // Si el dominio está en la lista de permitidos, permite la redirección
        if (allowedDomains.some(domain => urlObj.hostname.includes(domain))) {
          // Si es localhost en producción, redirige a la URL de producción
          if (process.env.NODE_ENV === "production" && urlObj.hostname === "localhost") {
            return url.replace("http://localhost:3000", productionUrl);
          }
          return url;
        }
      }

      // Si no coincide con ninguna condición, redirige a la URL base
      return effectiveBaseUrl;
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  debug: process.env.NODE_ENV === 'development',
} as const;

export default authOptions; 