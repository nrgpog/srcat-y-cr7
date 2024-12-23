import type { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from 'bcryptjs';
import dbConnect from '../app/utils/mongodb';
import User from '../app/models/User';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN!;
const DISCORD_SERVER_ID = process.env.DISCORD_SERVER_ID!;

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

const isDevelopment = process.env.NODE_ENV === 'development';
const baseUrl = isDevelopment ? 'http://localhost:3000' : 'https://energytools.vercel.app';

// Función para obtener la configuración de cookies según el entorno
const getCookieConfig = () => {
  const baseConfig = {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    secure: !isDevelopment
  };

  if (!isDevelopment) {
    return {
      ...baseConfig,
      domain: '.energytools.vercel.app'
    };
  }

  return baseConfig;
};

const getStateCookieConfig = () => {
  const baseConfig = {
    httpOnly: true,
    secure: !isDevelopment,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 900 // 15 minutos
  };

  if (!isDevelopment) {
    return {
      ...baseConfig,
      domain: '.energytools.vercel.app'
    };
  }

  return baseConfig;
};

async function inviteUserToServer(userId: string, accessToken: string) {
  try {
    console.log('🔄 Intentando añadir usuario al servidor...');
    // Primero intentamos añadir al usuario directamente al servidor
    const addToServerResponse = await fetch(
      `https://discord.com/api/v10/guilds/${DISCORD_SERVER_ID}/members/${userId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: accessToken,
        }),
      }
    );

    if (!addToServerResponse.ok) {
      console.log('⚠️ No se pudo añadir directamente, creando invitación...');

      // Obtener canales del servidor
      const channelsResponse = await fetch(
        `https://discord.com/api/v10/guilds/${DISCORD_SERVER_ID}/channels`,
        {
          headers: {
            Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
          },
        }
      );

      const channelsData = await channelsResponse.json();
      
      // Verificar que channels sea un array
      if (!Array.isArray(channelsData)) {
        console.error('❌ Error: La respuesta de canales no es un array:', channelsData);
        throw new Error('La respuesta de canales no tiene el formato esperado');
      }

      console.log(`📊 Canales encontrados: ${channelsData.length}`);
      
      // Buscar el primer canal de texto (type 0 = canal de texto)
      const firstTextChannel = channelsData.find((channel: any) => channel.type === 0);

      if (!firstTextChannel) {
        console.error('❌ No se encontró un canal de texto válido');
        throw new Error('No se encontró un canal de texto válido');
      }

      console.log(`✅ Canal seleccionado: ${firstTextChannel.name}`);

      // Crear invitación única
      const createInviteResponse = await fetch(
        `https://discord.com/api/v10/channels/${firstTextChannel.id}/invites`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            max_age: 86400, // 24 horas
            max_uses: 1,
            unique: true,
          }),
        }
      );

      if (!createInviteResponse.ok) {
        console.error('❌ Error al crear la invitación:', await createInviteResponse.text());
        throw new Error('No se pudo crear la invitación');
      }

      const invite = await createInviteResponse.json();
      console.log('✅ Invitación creada exitosamente');

      // Crear DM con el usuario
      const dmChannelResponse = await fetch(
        `https://discord.com/api/v10/users/@me/channels`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipient_id: userId,
          }),
        }
      );

      if (!dmChannelResponse.ok) {
        console.error('❌ Error al crear el canal DM:', await dmChannelResponse.text());
        throw new Error('No se pudo crear el canal DM');
      }

      const dmChannel = await dmChannelResponse.json();
      console.log('✅ Canal DM creado exitosamente');

      // Enviar mensaje con la invitación
      await fetch(
        `https://discord.com/api/v10/channels/${dmChannel.id}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: `
¡Bienvenido a Energy Tools! 🚀

Aquí tienes tu invitación exclusiva a nuestro servidor de Discord:
https://discord.gg/${invite.code}

Esta invitación es única y expirará en 24 horas.
            `.trim(),
            components: [
              {
                type: 1,
                components: [
                  {
                    type: 2,
                    style: 5,
                    label: "Unirse al Servidor",
                    url: `https://discord.gg/${invite.code}`,
                  },
                ],
              },
            ],
          }),
        }
      );

      console.log('✅ Invitación enviada por DM');
    } else {
      console.log('✅ Usuario añadido directamente al servidor');

      // Asignar rol automáticamente si lo deseas
      if (process.env.DISCORD_DEFAULT_ROLE_ID) {
        await fetch(
          `https://discord.com/api/v10/guilds/${DISCORD_SERVER_ID}/members/${userId}/roles/${process.env.DISCORD_DEFAULT_ROLE_ID}`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
            },
          }
        );
        console.log('✅ Rol asignado exitosamente');
      }
    }
  } catch (error) {
    console.error('❌ Error en el proceso de invitación:', error);
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "identify email guilds.join"
        }
      },
      profile(profile) {
        if (profile.avatar === null) {
          const defaultAvatarNumber = parseInt(profile.discriminator) % 5;
          profile.image_url = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNumber}.png`;
        } else {
          const format = profile.avatar.startsWith("a_") ? "gif" : "png";
          profile.image_url = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${format}`;
        }
        return {
          id: profile.id,
          name: profile.username,
          email: profile.email,
          image: profile.image_url,
        };
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
    async jwt({ token, user, account }) {
      if (user) {
        token.id = (user as ExtendedUser).id;
        if (account?.provider === 'discord' && account.access_token) {
          token.accessToken = account.access_token;
          try {
            await inviteUserToServer(user.id, account.access_token);
          } catch (error) {
            console.error('Error inviting user to server:', error);
          }
        }
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
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith("http")) {
        try {
          const urlObj = new URL(url);
          if (urlObj.hostname === "discord.com" || urlObj.hostname.endsWith("energytools.vercel.app") || urlObj.hostname === "localhost") {
            return url;
          }
        } catch {
          return baseUrl;
        }
      }
      return baseUrl;
    }
  },
  cookies: {
    sessionToken: {
      name: isDevelopment ? 'next-auth.session-token' : `__Secure-next-auth.session-token`,
      options: getCookieConfig()
    },
    callbackUrl: {
      name: isDevelopment ? 'next-auth.callback-url' : `__Secure-next-auth.callback-url`,
      options: getCookieConfig()
    },
    csrfToken: {
      name: isDevelopment ? 'next-auth.csrf-token' : `__Host-next-auth.csrf-token`,
      options: {
        ...getCookieConfig(),
        domain: undefined
      }
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: isDevelopment,
} as const;

export default authOptions;
