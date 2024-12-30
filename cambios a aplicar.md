Modificaciones en Layout.tsx
Añadir el estado para controlar la visibilidad del banner (opcional, si quieres que el usuario pueda cerrarlo):

typescript
Copy
const [isBannerVisible, setIsBannerVisible] = useState(true);
Añadir el banner en el JSX, justo después del header:

tsx
Copy
{isBannerVisible && (
  <motion.div
    initial={{ opacity: 0, y: -50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -50 }}
    className="bg-yellow-400/10 border-b border-yellow-400/20 text-yellow-400 p-3 text-center text-sm fixed top-16 w-full z-40 backdrop-blur-sm"
  >
    <div className="container mx-auto flex items-center justify-center space-x-3">
      <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
      <span>
        ¡Es crucial que apoyes al servidor creador de Energy Tools! Si no recibimos suficiente apoyo, Energy Tools podría ser eliminado. 
        <a
          href="https://tuservidor.com/apoyo"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-yellow-300 transition-colors"
        >
          Haz clic aquí para apoyar
        </a>
      </span>
      <button
        onClick={() => setIsBannerVisible(false)}
        className="p-1 hover:bg-yellow-400/20 rounded-full transition-colors"
        aria-label="Cerrar aviso"
      >
        <FiX className="w-4 h-4" />
      </button>
    </div>
  </motion.div>
)}
Ajustar el margen superior del main para que el contenido no quede oculto detrás del banner:

tsx
Copy
<main className="pt-32 md:pl-64"> {/* Aumenta el padding-top para el banner */}
  {children}
</main>