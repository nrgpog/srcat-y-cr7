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
      try {
        console.log("🔐 SignIn callback iniciado");
        console.log("👤 User data:", JSON.stringify(user, null, 2));
        console.log("🔑 Account data:", JSON.stringify(account, null, 2));
        console.log("👥 Profile data:", JSON.stringify(profile, null, 2));
        return true;
      } catch (error) {
        console.error("❌ Error en signIn callback:", error);
        return false;
      }
    },
    async jwt({ token, account, profile }) {
      try {
        console.log("🎟️ JWT callback iniciado");
        console.log("🔑 Token actual:", JSON.stringify(token, null, 2));
        
        if (account && profile) {
          console.log("✅ Actualizando token con nueva información");
          token.accessToken = account.access_token;
          token.discordId = (profile as any).id;
        }
        
        return token;
      } catch (error) {
        console.error("❌ Error en JWT callback:", error);
        return token;
      }
    },
    async session({ session, token }) {
      try {
        console.log("📍 Session callback iniciado");
        
        if (session.user) {
          session.user.discordId = token.discordId;
          session.user.accessToken = token.accessToken;
        }
        
        return session;
      } catch (error) {
        console.error("❌ Error en session callback:", error);
        return session;
      }
    },
    async redirect({ url, baseUrl }) {
      try {
        console.log("\n🔄 REDIRECT CALLBACK INICIADO 🔄");
        console.log("📍 URL recibida:", url);
        console.log("🌐 Base URL:", baseUrl);
        
        // Usar la URL base de Replit
        const baseURL = "https://23662baa-de51-4bed-8f65-0c81ffb0367c-00-18dtigdrwmpdq.worf.replit.dev";
        
        // Si es una URL de error o contiene error
        if (url.includes('error') || url.includes('OAuthCallback')) {
          console.log("❌ Error detectado en la URL:", url);
          return `${baseURL}/auth/error`;
        }
        
        // Si es el callback de Discord
        if (url.includes('/api/auth/callback/discord')) {
          console.log("✅ Procesando callback de Discord");
          return `${baseURL}/dashboard`;
        }
        
        // Si es una URL relativa
        if (url.startsWith('/')) {
          return `${baseURL}${url}`;
        }
        
        // Si la URL es del mismo dominio
        if (url.startsWith(baseURL)) {
          return url;
        }
        
        // Por defecto, ir al dashboard
        return `${baseURL}/dashboard`;
      } catch (error) {
        console.error("❌ Error en redirect callback:", error);
        return baseUrl;
      }
    }
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
  debug: true,
});

export { handler as GET, handler as POST };
