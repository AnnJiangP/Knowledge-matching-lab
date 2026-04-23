
import React, { useState, useEffect, useRef } from 'react';
import { ViewType, DataEntry } from './types';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import KnowledgeBase from './components/KnowledgeBase';
import Dashboard from './components/Dashboard';
import SmartExtraction from './components/SmartExtraction';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [knowledgeBase, setKnowledgeBase] = useState<DataEntry[]>([]);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const isInitialMount = useRef(true);
  const isDataLoaded = useRef(false);

  // Load from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('privacy_vault_db');
    const savedTime = localStorage.getItem('privacy_vault_last_saved');
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setKnowledgeBase(parsed);
          setLastSaved(savedTime);
        }
      } catch (e) {
        console.error("Failed to parse saved data", e);
      }
    }
    isDataLoaded.current = true;
  }, []);

  // Save to LocalStorage whenever knowledgeBase changes
  useEffect(() => {
    // Skip saving on the very first mount or before loading is complete
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!isDataLoaded.current) return;

    localStorage.setItem('privacy_vault_db', JSON.stringify(knowledgeBase));
    const now = new Date().toLocaleTimeString();
    localStorage.setItem('privacy_vault_last_saved', now);
    setLastSaved(now);
  }, [knowledgeBase]);

  const addEntry = (entry: Omit<DataEntry, 'id' | 'dateAdded'>) => {
    const newEntry: DataEntry = {
      ...entry,
      id: Math.random().toString(36).substring(2, 9),
      dateAdded: new Date().toISOString(),
    };
    setKnowledgeBase(prev => [...prev, newEntry]);
  };

  const updateEntry = (updatedEntry: DataEntry) => {
    setKnowledgeBase(prev => prev.map(e => e.id === updatedEntry.id ? updatedEntry : e));
  };

  const addEntries = (entries: Omit<DataEntry, 'id' | 'dateAdded'>[]) => {
    const newEntries: DataEntry[] = entries.map(e => ({
      ...e,
      id: Math.random().toString(36).substring(2, 9),
      dateAdded: new Date().toISOString(),
    }));
    setKnowledgeBase(prev => [...prev, ...newEntries]);
  };

  const removeEntry = (id: string) => {
    setKnowledgeBase(prev => prev.filter(e => e.id !== id));
  };

  const handleImport = (data: DataEntry[]) => {
    setKnowledgeBase(prev => {
      const existingIds = new Set(prev.map(e => e.id));
      const newEntries = data.filter(e => !existingIds.has(e.id));
      
      // Also check for duplicate content to avoid double-adding if IDs were re-generated
      const uniqueNewEntries = newEntries.filter(newEntry => 
        !prev.some(oldEntry => 
          oldEntry.topic === newEntry.topic && 
          oldEntry.value === newEntry.value && 
          oldEntry.country === newEntry.country &&
          oldEntry.year === newEntry.year
        )
      );

      if (uniqueNewEntries.length === 0 && data.length > 0) {
        alert("Wait! These items are already in your Matching Lab.");
        return prev;
      }

      if (uniqueNewEntries.length < data.length) {
        alert(`Merged data: Added ${uniqueNewEntries.length} new items, skipped ${data.length - uniqueNewEntries.length} duplicates.`);
      } else {
        alert(`Successfully imported ${uniqueNewEntries.length} new items!`);
      }

      return [...prev, ...uniqueNewEntries];
    });
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard entries={knowledgeBase} />;
      case 'chat':
        return <ChatInterface knowledgeBase={knowledgeBase} />;
      case 'extraction':
        return <SmartExtraction onAddEntries={addEntries} />;
      case 'knowledge-base':
        return (
          <KnowledgeBase 
            entries={knowledgeBase} 
            onAddEntry={addEntry} 
            onUpdateEntry={updateEntry}
            onRemoveEntry={removeEntry}
            onImport={handleImport}
          />
        );
      default:
        return <Dashboard entries={knowledgeBase} />;
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f8fafc]">
      <Sidebar currentView={currentView} setView={setCurrentView} lastSaved={lastSaved} />
      
      <main className="flex-1 ml-64 p-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <span className="text-xs font-bold text-blue-600 tracking-widest uppercase">Privacy Scientist Workstation</span>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800">
                {currentView === 'dashboard' && "Project Overview"}
                {currentView === 'chat' && "AI Research Assistant"}
                {currentView === 'extraction' && "Smart AI Extraction"}
                {currentView === 'knowledge-base' && "Citation Matching Library"}
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold">JD</div>
              <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">AI</div>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <button className="text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </header>

        <div className="max-w-6xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
