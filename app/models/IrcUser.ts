import mongoose from 'mongoose';

interface IIrcUser {
  userId: string;
  username: string;
  isConnected: boolean;
  joinedAt: Date;
  lastSeen: Date;
  userColor: string;
}

const ircUserSchema = new mongoose.Schema<IIrcUser>({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
  },
  isConnected: {
    type: Boolean,
    default: false,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  userColor: {
    type: String,
    required: true,
    default: () => {
      // Lista de colores disponibles para los brackets
      const colors = [
        '#FF4136', // Rojo
        '#FF851B', // Naranja
        '#FFDC00', // Amarillo
        '#2ECC40', // Verde
        '#0074D9', // Azul
        '#B10DC9', // Púrpura
        '#F012BE', // Magenta
        '#01FF70', // Verde lima
        '#7FDBFF', // Celeste
        '#FF4081', // Rosa
        '#E91E63', // Rosa oscuro
        '#9C27B0', // Morado
        '#673AB7', // Violeta
        '#3F51B5', // Índigo
        '#00BCD4', // Cyan
      ];
      // Seleccionar un color aleatorio
      return colors[Math.floor(Math.random() * colors.length)];
    }
  }
});

const IrcUser = (mongoose.models.IrcUser as mongoose.Model<IIrcUser>) || mongoose.model<IIrcUser>('IrcUser', ircUserSchema);

export default IrcUser; 