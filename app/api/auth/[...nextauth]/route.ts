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
      console.log("🔐 SignIn callback iniciado");
      console.log("👤 User data:", JSON.stringify(user, null, 2));
      console.log("🔑 Account data:", JSON.stringify(account, null, 2));
      console.log("👥 Profile data:", JSON.stringify(profile, null, 2));
      return true;
    },
    async jwt({ token, account, profile }) {
      console.log("🎟️ JWT callback iniciado");
      console.log("🔑 Token actual:", JSON.stringify(token, null, 2));
      console.log("👤 Account data:", JSON.stringify(account, null, 2));
      console.log("👥 Profile data:", JSON.stringify(profile, null, 2));
      
      if (account && profile) {
        console.log("✅ Actualizando token con nueva información");
        token.accessToken = account.access_token;
        token.discordId = (profile as any).id;
      }
      
      console.log("🔄 Token actualizado:", JSON.stringify(token, null, 2));
      return token;
    },
    async session({ session, token }) {
      console.log("📍 Session callback iniciado");
      console.log("📌 Session actual:", JSON.stringify(session, null, 2));
      console.log("🎟️ Token actual:", JSON.stringify(token, null, 2));
      
      if (session.user) {
        console.log("✅ Actualizando session con información del token");
        session.user.discordId = token.discordId;
        session.user.accessToken = token.accessToken;
      }
      
      console.log("🔄 Session actualizada:", JSON.stringify(session, null, 2));
      return session;
    },
    async redirect({ url, baseUrl }) {
      console.log("\n🔄 REDIRECT CALLBACK INICIADO 🔄");
      console.log("📍 URL recibida:", url);
      console.log("🌐 Base URL:", baseUrl);
      
      const baseURL = process.env.NEXTAUTH_URL!;
      console.log("🎯 URL base a usar:", baseURL);
      
      // Si es una URL de error, analizar el error
      if (url.includes('error=')) {
        console.log("❌ URL contiene error:", url);
        const errorParams = new URLSearchParams(url.split('?')[1]);
        console.log("⚠️ Error details:", {
          error: errorParams.get('error'),
          errorDescription: errorParams.get('error_description')
        });
        return `${baseURL}/auth/error`;
      }
      
      // Si es el callback de Discord, siempre ir al dashboard
      if (url.includes('/api/auth/callback/discord')) {
        console.log("✅ URL es callback de Discord, redirigiendo a dashboard");
        return `${baseURL}/dashboard`;
      }
      
      // Si es una URL relativa
      if (url.startsWith('/')) {
        const finalUrl = `${baseURL}${url}`;
        console.log("📌 Convirtiendo relativa a absoluta:", finalUrl);
        return finalUrl;
      }
      
      // Si la URL es del mismo dominio
      if (url.startsWith(baseURL)) {
        console.log("🏠 Manteniendo URL del mismo dominio:", url);
        return url;
      }
      
      // Por defecto, ir al dashboard
      console.log("🔄 Redirección por defecto al dashboard");
      return `${baseURL}/dashboard`;
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
