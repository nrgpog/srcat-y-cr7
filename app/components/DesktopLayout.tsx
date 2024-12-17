import { FiTool, FiCheck, FiGrid, FiSettings, FiMenu } from 'react-icons/fi';

export default function DesktopLayout() {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <aside className="w-64 bg-black text-white min-h-screen p-6">
        <div className="flex items-center space-x-3 mb-10">
          <FiTool className="w-6 h-6" />
          <h1 className="text-xl font-bold">Tools</h1>
        </div>
        
        <nav className="space-y-6">
          <div>
            <h2 className="text-gray-400 text-sm uppercase mb-3">Menu</h2>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3 p-2 bg-gray-800 rounded-lg">
                <FiCheck className="w-5 h-5" />
                <span>Checkers</span>
              </li>
              <li className="flex items-center space-x-3 p-2 hover:bg-gray-800 rounded-lg cursor-pointer">
                <FiGrid className="w-5 h-5" />
                <span>Dashboard</span>
              </li>
              <li className="flex items-center space-x-3 p-2 hover:bg-gray-800 rounded-lg cursor-pointer">
                <FiSettings className="w-5 h-5" />
                <span>Settings</span>
              </li>
            </ul>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Checkers</h1>
          </header>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Checker Cards */}
            <div className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Syntax Checker</h3>
                <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center">
                  <FiCheck className="w-5 h-5" />
                </div>
              </div>
              <p className="text-gray-600 mb-4">Verifica la sintaxis de tu código en tiempo real</p>
              <button className="w-full py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
                Iniciar Check
              </button>
            </div>

            <div className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Code Quality</h3>
                <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center">
                  <FiCheck className="w-5 h-5" />
                </div>
              </div>
              <p className="text-gray-600 mb-4">Analiza la calidad de tu código y obtén sugerencias</p>
              <button className="w-full py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
                Analizar
              </button>
            </div>

            <div className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Performance</h3>
                <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center">
                  <FiCheck className="w-5 h-5" />
                </div>
              </div>
              <p className="text-gray-600 mb-4">Mide el rendimiento de tu aplicación</p>
              <button className="w-full py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
                Medir
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 