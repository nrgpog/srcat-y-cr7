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

// URLs permitidas para redirección
const allowedUrls = [
  "http://localhost:3000",
  "https://23662baa-de51-4bed-8f65-0c81ffb0367c-00-18dtigdrwmpdq.worf.replit.dev"
];

// Detectar la URL base actual
const getBaseUrl = () => {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.REPLIT_SLUG) return `https://${process.env.REPLIT_SLUG}.repl.co`;
  return process.env.NEXTAUTH_URL || "http://localhost:3000";
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
        token.discordId = (profile as DiscordProfile).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.discordId = token.discordId;
        session.user.accessToken = token.accessToken;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Permitir redirecciones a cualquiera de las URLs permitidas
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (allowedUrls.some(allowedUrl => url.startsWith(allowedUrl))) return url;
      return baseUrl;
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
