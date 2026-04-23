
import React, { useState } from 'react';
import { DataEntry } from '../types';
import { gemini } from '../services/geminiService';
import { 
  Wand2, 
  CheckCircle2, 
  Trash2, 
  X, 
  FileText, 
  FileJson, 
  Globe, 
  PlusCircle,
  Loader2,
  Info
} from 'lucide-react';

interface SmartExtractionProps {
  onAddEntries: (entries: Omit<DataEntry, 'id' | 'dateAdded'>[]) => void;
}

const SmartExtraction: React.FC<SmartExtractionProps> = ({ onAddEntries }) => {
  const [inputText, setInputText] = useState('');
  const [extractedData, setExtractedData] = useState<Partial<DataEntry>[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [batchReportId, setBatchReportId] = useState('');

  const handleExtract = async () => {
    if (!inputText.trim()) return;
    setIsExtracting(true);
    setIsSaved(false);
    try {
      const data = await gemini.extractDataEntries(inputText);
      // If AI didn't find a report ID but user has a batch ID, apply it
      const processedData = data.map(item => ({
        ...item,
        reportId: item.reportId || batchReportId || ''
      }));
      setExtractedData(processedData);
    } catch (error) {
      console.error(error);
      alert("Failed to extract data. Please try again.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSaveAll = () => {
    const validEntries = extractedData.filter(d => d.topic && d.value).map(d => ({
      ...d,
      reportId: d.reportId || batchReportId || ''
    })) as Omit<DataEntry, 'id' | 'dateAdded'>[];
    
    onAddEntries(validEntries);
    setExtractedData([]);
    setInputText('');
    setBatchReportId('');
    setIsSaved(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">AI Data Extractor</h2>
          <p className="text-slate-500">Paste report snippets or links to automatically identify metrics.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Default Report ID (Optional)</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition font-mono uppercase text-sm"
              placeholder="e.g. D25-348"
              value={batchReportId}
              onChange={(e) => setBatchReportId(e.target.value)}
            />
            <p className="text-[10px] text-slate-400 mt-1">If set, this ID will be applied to all extracted items unless the AI finds a specific one.</p>
          </div>
          
          <textarea
            className="w-full h-56 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none transition"
            placeholder="Paste text here... (e.g. 'Report D25-348 notes that 12% of people...')"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          ></textarea>
          
          <button
            onClick={handleExtract}
            disabled={isExtracting || !inputText.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2"
          >
            {isExtracting ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" />
                Extracting Insights...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                Run AI Extraction
              </>
            )}
          </button>
        </div>
        
        {isSaved && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 flex items-center gap-3 animate-in fade-in duration-300">
            <CheckCircle2 className="w-6 h-6" />
            Data successfully added to your Matching Lab!
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800">Preview & Confirm</h3>
          {extractedData.length > 0 && (
            <button 
              onClick={handleSaveAll}
              className="text-blue-600 hover:text-blue-700 font-bold text-sm underline px-2 py-1 hover:bg-blue-50 rounded transition flex items-center gap-1"
            >
              <PlusCircle className="w-4 h-4" />
              Add all to Vault
            </button>
          )}
        </div>

        <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2 custom-scrollbar">
          {extractedData.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-12 text-center text-slate-400">
              <FileJson className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No results yet. Paste text on the left to begin.</p>
            </div>
          ) : (
            extractedData.map((data, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative group hover:border-blue-300 transition">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex gap-2">
                    <span className="text-[10px] uppercase font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded">
                      {data.category}
                    </span>
                    {data.reportId && (
                      <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {data.reportId}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Globe className="w-3 h-3 text-slate-400" />
                    {data.country} · {data.year}
                  </span>
                </div>
                <h4 className="font-bold text-slate-800 mb-1">{data.topic}</h4>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-2xl font-black text-blue-600">{data.value}</span>
                  <span className="text-sm text-slate-500 font-medium">{data.unit}</span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  <span className="truncate">{data.source}</span>
                </div>
                <button 
                  onClick={() => {
                    const filtered = extractedData.filter((_, i) => i !== idx);
                    setExtractedData(filtered);
                  }}
                  className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};

export default SmartExtraction;
