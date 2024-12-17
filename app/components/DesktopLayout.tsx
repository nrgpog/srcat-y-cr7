import { FiTool, FiCheck, FiGrid, FiSettings, FiMenu } from 'react-icons/fi';

export default function DesktopLayout() {
  return (
    <div className="flex min-h-screen bg-[#121212]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0A0A0A] text-white min-h-screen p-6">
        <div className="flex items-center space-x-3 mb-10">
          <FiTool className="w-6 h-6" />
          <h1 className="text-xl font-bold">Tools</h1>
        </div>
        
        <nav className="space-y-6">
          <div>
            <h2 className="text-gray-400 text-sm uppercase mb-3">MENU</h2>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3 p-2 bg-[#1E1E1E] rounded-lg">
                <FiCheck className="w-5 h-5" />
                <span>Checkers</span>
              </li>
              <li className="flex items-center space-x-3 p-2 hover:bg-[#1E1E1E] rounded-lg cursor-pointer transition-colors">
                <FiGrid className="w-5 h-5" />
                <span>Dashboard</span>
              </li>
              <li className="flex items-center space-x-3 p-2 hover:bg-[#1E1E1E] rounded-lg cursor-pointer transition-colors">
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
            <h1 className="text-3xl font-bold text-white">Checkers</h1>
          </header>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Checker Cards */}
            <div className="p-6 bg-[#1A1A1A] rounded-lg hover:bg-[#1E1E1E] transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Syntax Checker</h3>
                <div className="w-10 h-10 bg-[#2A2A2A] text-white rounded-full flex items-center justify-center">
                  <FiCheck className="w-5 h-5" />
                </div>
              </div>
              <p className="text-gray-400 mb-4">Verifica la sintaxis de tu código en tiempo real</p>
              <button className="w-full py-2 bg-[#2A2A2A] text-white rounded-lg hover:bg-[#333333] transition-colors">
                Iniciar Check
              </button>
            </div>

            <div className="p-6 bg-[#1A1A1A] rounded-lg hover:bg-[#1E1E1E] transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Code Quality</h3>
                <div className="w-10 h-10 bg-[#2A2A2A] text-white rounded-full flex items-center justify-center">
                  <FiCheck className="w-5 h-5" />
                </div>
              </div>
              <p className="text-gray-400 mb-4">Analiza la calidad de tu código y obtén sugerencias</p>
              <button className="w-full py-2 bg-[#2A2A2A] text-white rounded-lg hover:bg-[#333333] transition-colors">
                Analizar
              </button>
            </div>

            <div className="p-6 bg-[#1A1A1A] rounded-lg hover:bg-[#1E1E1E] transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Performance</h3>
                <div className="w-10 h-10 bg-[#2A2A2A] text-white rounded-full flex items-center justify-center">
                  <FiCheck className="w-5 h-5" />
                </div>
              </div>
              <p className="text-gray-400 mb-4">Mide el rendimiento de tu aplicación</p>
              <button className="w-full py-2 bg-[#2A2A2A] text-white rounded-lg hover:bg-[#333333] transition-colors">
                Medir
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 