import mongoose from 'mongoose';

interface IIrcMessage {
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
}

const ircMessageSchema = new mongoose.Schema<IIrcMessage>({
  userId: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const IrcMessage = (mongoose.models.IrcMessage as mongoose.Model<IIrcMessage>) || mongoose.model<IIrcMessage>('IrcMessage', ircMessageSchema);

export default IrcMessage; 