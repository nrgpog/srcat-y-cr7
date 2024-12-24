import mongoose from 'mongoose';

interface IIrcUser {
  userId: string;
  username: string;
  isConnected: boolean;
  joinedAt: Date;
  lastSeen: Date;
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
});

const IrcUser = (mongoose.models.IrcUser as mongoose.Model<IIrcUser>) || mongoose.model<IIrcUser>('IrcUser', ircUserSchema);

export default IrcUser; 