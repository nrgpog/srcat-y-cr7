// src/app/models/User.ts
import mongoose, { Schema, model, models } from 'mongoose';

export interface IUser {
  email: string;
  password: string;
  name?: string;
  image?: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Por favor proporciona un email'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Por favor ingresa un email válido']
  },
  password: {
    type: String,
    required: [true, 'Por favor proporciona una contraseña'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
  },
  name: {
    type: String,
    trim: true
  },
  image: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware para logging
UserSchema.pre('save', function(next) {
  console.log('🔄 Guardando usuario:', this.email);
  next();
});

UserSchema.post('save', function(doc) {
  console.log('✅ Usuario guardado exitosamente:', doc.email);
});

// Verificar si el modelo ya existe antes de crearlo
const User = models.User || model('User', UserSchema);

export default User;
