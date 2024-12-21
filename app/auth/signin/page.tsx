'use client';
import { useState, useEffect } from 'react';
import { signIn, useSession } from "next-auth/react";
import { FiZap, FiMail, FiLock, FiUser, FiAlertCircle } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function SignIn() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="text-yellow-400"
        >
          <FiZap className="w-12 h-12" />
        </motion.div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        if (!email.trim() || !password.trim()) {
          setError('Por favor completa todos los campos');
          setLoading(false);
          return;
        }

        if (!email.includes('@')) {
          setError('Por favor ingresa un email válido');
          setLoading(false);
          return;
        }

        console.log('🔄 Iniciando proceso de login...');
        const result = await signIn('credentials', {
          redirect: false,
          email: email.toLowerCase().trim(),
          password,
          callbackUrl: '/'
        });

        console.log('📬 Resultado del login:', result);

        if (result?.error) {
          console.log('❌ Error en login:', result.error);
          if (result.error.includes('CredentialsSignin')) {
            setError('Email o contraseña incorrectos');
          } else if (result.error.includes('Email not verified')) {
            setError('Por favor verifica tu email antes de iniciar sesión');
          } else {
            setError('Error al iniciar sesión. Por favor intenta nuevamente');
          }
          setLoading(false);
          return;
        }

        console.log('✅ Login exitoso, actualizando sesión...');
        await update();
        router.replace('/');

      } else {
        if (!name.trim() || !email.trim() || !password.trim()) {
          setError('Por favor completa todos los campos');
          setLoading(false);
          return;
        }

        if (name.length < 3) {
          setError('El nombre debe tener al menos 3 caracteres');
          setLoading(false);
          return;
        }

        if (!email.includes('@')) {
          setError('Por favor ingresa un email válido');
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres');
          setLoading(false);
          return;
        }

        console.log('🔄 Iniciando proceso de registro...');
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password,
          }),
        });

        const data = await res.json();
        console.log('📬 Respuesta del servidor:', data);

        if (!res.ok) {
          console.log('❌ Error en registro:', data.error);
          if (data.error.includes('email already exists')) {
            setError('Este email ya está registrado');
          } else if (data.error.includes('invalid email')) {
            setError('El email ingresado no es válido');
          } else {
            setError(data.error || 'Error al registrar usuario');
          }
          setLoading(false);
          return;
        }

        console.log('✅ Registro exitoso, intentando login automático...');
        await new Promise(resolve => setTimeout(resolve, 500));

        const result = await signIn('credentials', {
          redirect: false,
          email: email.toLowerCase().trim(),
          password,
          callbackUrl: '/'
        });

        console.log('📬 Resultado del login automático:', result);

        if (result?.error) {
          console.log('❌ Error en login automático:', result.error);
          setError('Cuenta creada con éxito. Por favor inicia sesión manualmente');
          setLoading(false);
          setIsLogin(true);
          return;
        }

        console.log('✅ Login automático exitoso, actualizando sesión...');
        await update();
        router.replace('/');
      }
    } catch (err) {
      console.error('❌ Error inesperado:', err);
      setError('Error de conexión. Por favor intenta nuevamente');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = `
    w-full bg-black/40 text-white rounded-lg py-3 px-10
    border border-gray-700 focus:border-yellow-400
    focus:ring-2 focus:ring-yellow-400/20 focus:outline-none
    transition-all duration-300 backdrop-blur-sm
    placeholder:text-gray-500
  `;

  const buttonClasses = `
    w-full py-3 px-4 rounded-lg font-medium
    transition-all duration-300 transform hover:scale-[1.02]
    active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
    disabled:hover:scale-100 focus:outline-none focus:ring-2
    focus:ring-yellow-400/20
  `;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-orange-500/10 rounded-2xl blur-xl" />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xl rounded-2xl" />

        <div className="relative bg-black/50 p-8 rounded-2xl border border-gray-800 backdrop-blur-sm shadow-2xl">
          <div className="flex flex-col items-center space-y-6">
            <motion.div
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
            >
              <FiZap className="w-12 h-12 text-yellow-400" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-3xl font-bold text-white text-center bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent"
            >
              Energy Tools
            </motion.h1>

            <AnimatePresence mode="wait">
              <motion.form
                key={isLogin ? 'login' : 'register'}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full space-y-5"
                onSubmit={handleSubmit}
              >
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <label className="text-sm text-gray-400 font-medium">Nombre</label>
                    <div className="relative group">
                      <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-yellow-400 transition-colors" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={inputClasses}
                        placeholder="Tu nombre"
                        required={!isLogin}
                      />
                    </div>
                  </motion.div>
                )}

                <div className="space-y-2">
                  <label className="text-sm text-gray-400 font-medium">Email</label>
                  <div className="relative group">
                    <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-yellow-400 transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClasses}
                      placeholder="tu@email.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-400 font-medium">Contraseña</label>
                  <div className="relative group">
                    <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-yellow-400 transition-colors" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputClasses}
                      placeholder="•••••••"
                      required
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2 bg-red-500/10 text-red-400 p-3 rounded-lg"
                    >
                      <FiAlertCircle />
                      <p className="text-sm">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={loading}
                  className={`${buttonClasses} ${
                    loading
                      ? 'bg-gray-700'
                      : 'bg-gradient-to-r from-yellow-400 to-orange-500'
                  }`}
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <FiZap className="w-5 h-5 mx-auto" />
                    </motion.div>
                  ) : (
                    isLogin ? 'Iniciar Sesión' : 'Registrarse'
                  )}
                </button>
              </motion.form>
            </AnimatePresence>

            <div className="flex items-center w-full">
              <div className="flex-1 border-t border-gray-800"></div>
              <span className="px-4 text-gray-400">o</span>
              <div className="flex-1 border-t border-gray-800"></div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`${buttonClasses} bg-[#5865F2] hover:bg-[#4752C4] flex items-center justify-center gap-2`}
              onClick={() => signIn('discord', { callbackUrl: '/' })}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Iniciar sesión con Discord
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsLogin(!isLogin)}
              className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
            >
              {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
