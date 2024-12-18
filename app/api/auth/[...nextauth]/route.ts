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

const REPLIT_URL = "https://23662baa-de51-4bed-8f65-0c81ffb0367c-00-18dtigdrwmpdq.worf.replit.dev";

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
      httpOptions: {
        timeout: 10000, // Aumentar el timeout a 10 segundos
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
        if (account && profile) {
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
      console.log("🔄 Redirect callback:", { url, baseUrl });

      // Si la URL contiene un error
      if (url.includes("error")) {
        console.log("❌ Error en URL, redirigiendo a página de error");
        return `${REPLIT_URL}/auth/error`;
      }

      // Si es el callback de Discord
      if (url.includes("/api/auth/callback/discord")) {
        console.log("✅ Callback de Discord detectado");
        return `${REPLIT_URL}/dashboard`;
      }

      // Si es una URL relativa
      if (url.startsWith("/")) {
        console.log("📍 URL relativa detectada");
        return `${REPLIT_URL}${url}`;
      }

      // Si la URL es del mismo dominio
      if (url.startsWith(REPLIT_URL)) {
        console.log("🏠 URL del mismo dominio");
        return url;
      }

      console.log("➡️ Redirección por defecto al dashboard");
      return `${REPLIT_URL}/dashboard`;
    }
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 1 día
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
        domain: ".worf.replit.dev" // Dominio específico de Replit
      }
    }
  },
  debug: true,
});

export { handler as GET, handler as POST };
