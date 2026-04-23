
import React from 'react';
import { ViewType } from '../types';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Database, 
  FileSearch, 
  ShieldCheck,
  CircleDot
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  lastSaved: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, lastSaved }) => {
  const menuItems = [
    { id: 'dashboard' as ViewType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'chat' as ViewType, label: 'AI Assistant', icon: MessageSquare },
    { id: 'extraction' as ViewType, label: 'Smart Extract', icon: FileSearch },
    { id: 'knowledge-base' as ViewType, label: 'Data Lab', icon: Database },
  ];

  return (
    <div className="w-64 bg-slate-900 h-screen flex flex-col text-white fixed left-0 top-0 z-50">
      <div className="p-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <span className="bg-blue-600 p-2 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </span>
          Privacy Vault
        </h1>
      </div>

      <nav className="flex-1 mt-4 px-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              currentView === item.id 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-slate-800 space-y-4">
        <div className="flex flex-col gap-1 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-2 text-emerald-400">
            <CircleDot className="w-3 h-3 animate-pulse" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Local Persistence</span>
          </div>
          <p className="text-[10px] text-slate-400">
            {lastSaved ? `Auto-synced: ${lastSaved}` : 'Initializing storage...'}
          </p>
        </div>

        <div className="flex items-center gap-3 px-2 py-3 rounded-lg bg-slate-800/50">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-xs">
            PS
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">Privacy Scientist</p>
            <p className="text-xs text-slate-500 truncate">Expert Mode</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
