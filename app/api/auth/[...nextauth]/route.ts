import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { DefaultSession } from "next-auth";

// Definir la interfaz para el perfil de Discord
interface DiscordProfile {
  id: string;
  email: string;
  username: string;
  avatar: string;
  discriminator: string;
}

// Extender el tipo JWT
declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    discordId?: string;
  }
}

// Extender el tipo Session
declare module "next-auth" {
  interface Session {
    user: {
      discordId?: string;
      accessToken?: string;
    } & DefaultSession["user"];
  }
}

// Función para determinar si estamos en Replit
const isReplit = () => {
  return process.env.REPL_ID && process.env.REPL_OWNER;
};

// Función para obtener la URL base según el entorno
const getBaseUrl = () => {
  // Si estamos en Replit
  if (isReplit()) {
    return "https://23662baa-de51-4bed-8f65-0c81ffb0367c-00-18dtigdrwmpdq.worf.replit.dev";
  }
  // En desarrollo local
  return "http://localhost:3000";
};

const handler = NextAuth({
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
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      return true;
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.accessToken = account.access_token;
        token.discordId = profile?.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).discordId = token.discordId;
        (session.user as any).accessToken = token.accessToken;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      const currentBaseUrl = getBaseUrl();
      
      // Manejar la redirección después del callback de Discord
      if (url.includes('/api/auth/callback/discord')) {
        return currentBaseUrl;
      }
      
      // Si la URL es la página de inicio de sesión y el usuario ya está autenticado
      if (url.includes('/auth/signin')) {
        return currentBaseUrl;
      }
      
      // Si la URL comienza con una barra, añadirla a la URL base actual
      if (url.startsWith("/")) {
        return `${currentBaseUrl}${url}`;
      }
      
      // Si la URL comienza con la URL base actual, permitirla
      if (url.startsWith(currentBaseUrl)) {
        return url;
      }
      
      // Por defecto, redirigir a la página principal
      return currentBaseUrl;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  debug: process.env.NODE_ENV === "development",
});

export { handler as GET, handler as POST };
