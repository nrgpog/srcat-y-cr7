import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-black">
      <main className="container mx-auto px-4 py-20">
        <div className="flex flex-col items-center justify-center space-y-8 text-center">
          <h1 className="text-6xl font-bold tracking-tight">
            Bienvenido
          </h1>
          <p className="text-xl max-w-2xl mx-auto text-gray-700">
            Descubre una experiencia única y minimalista
          </p>
          <div className="w-16 h-1 bg-black my-8"></div>
          <button className="px-8 py-3 bg-black text-white hover:bg-gray-800 transition-colors duration-300 text-lg">
            Comenzar
          </button>
        </div>
        
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="p-6 border border-black">
            <h2 className="text-2xl font-semibold mb-4">Diseño</h2>
            <p className="text-gray-700">Minimalismo en blanco y negro para una experiencia visual única</p>
          </div>
          <div className="p-6 border border-black">
            <h2 className="text-2xl font-semibold mb-4">Elegancia</h2>
            <p className="text-gray-700">Simplicidad y sofisticación en cada detalle</p>
          </div>
          <div className="p-6 border border-black">
            <h2 className="text-2xl font-semibold mb-4">Innovación</h2>
            <p className="text-gray-700">Tecnología de vanguardia con un toque clásico</p>
          </div>
        </div>
      </main>
    </div>
  );
}
