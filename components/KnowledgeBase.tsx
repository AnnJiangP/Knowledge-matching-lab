
import React, { useState } from 'react';
import { DataEntry } from '../types';
import * as XLSX from 'xlsx';
import { 
  Download, 
  Upload, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Database,
  AlertCircle,
  FileJson,
  FileSpreadsheet,
  ChevronDown
} from 'lucide-react';

interface KnowledgeBaseProps {
  entries: DataEntry[];
  onAddEntry: (entry: Omit<DataEntry, 'id' | 'dateAdded'>) => void;
  onUpdateEntry: (entry: DataEntry) => void;
  onRemoveEntry: (id: string) => void;
  onImport: (data: DataEntry[]) => void;
}

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ entries, onAddEntry, onUpdateEntry, onRemoveEntry, onImport }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<DataEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<DataEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [formData, setFormData] = useState({
    topic: '', value: '', unit: '', country: '', year: '', source: '', category: 'Epidemiology' as any, reportId: '', notes: ''
  });

  const filteredEntries = entries.filter(e => 
    e.topic.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.reportId && e.reportId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openAddModal = () => {
    setEditingEntry(null);
    setFormData({ topic: '', value: '', unit: '', country: '', year: '', source: '', category: 'Epidemiology', reportId: '', notes: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (entry: DataEntry) => {
    setEditingEntry(entry);
    setFormData({
      topic: entry.topic,
      value: entry.value,
      unit: entry.unit,
      country: entry.country,
      year: entry.year,
      source: entry.source,
      category: entry.category,
      reportId: entry.reportId || '',
      notes: entry.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEntry) {
      onUpdateEntry({ ...editingEntry, ...formData });
    } else {
      onAddEntry(formData);
    }
    setIsModalOpen(false);
  };

  const confirmDelete = () => {
    if (entryToDelete) {
      onRemoveEntry(entryToDelete.id);
      setEntryToDelete(null);
    }
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(entries, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `privacy-vault-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(entries);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PrivacyVault_Data");
    XLSX.writeFile(workbook, `privacy-vault-export-${new Date().toISOString().slice(0, 10)}.xlsx`);
    setShowExportMenu(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop()?.toLowerCase();

    if (fileExt === 'json') {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          if (Array.isArray(json)) {
            onImport(json);
          } else {
            alert("Invalid JSON format: expected a array of entries.");
          }
        } catch (err) {
          alert("Error parsing JSON file.");
        }
      };
      reader.readAsText(file);
    } else if (fileExt === 'xlsx' || fileExt === 'xls') {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet) as any[];
          
          // Map fields if headers are different or just trust the keys match types.ts
          // For safety, we can sanitize the imported objects
          const sanitized = json.map(item => ({
            id: item.id ? String(item.id) : Math.random().toString(36).substring(2, 9),
            topic: String(item.topic || item.Topic || ''),
            value: String(item.value || item.Value || ''),
            unit: String(item.unit || item.Unit || ''),
            country: String(item.country || item.Country || ''),
            year: String(item.year || item.Year || ''),
            source: String(item.source || item.Source || ''),
            category: (['Epidemiology', 'Privacy Metrics', 'Demographics', 'Other'].includes(item.category || item.Category) ? (item.category || item.Category) : 'Other') as any,
            reportId: String(item.reportId || item.ReportID || item['Report ID'] || ''),
            notes: String(item.notes || item.Notes || ''),
            dateAdded: item.dateAdded || item.DateAdded || new Date().toISOString()
          }));

          // Basic validation: Must have topic and value
          const valid = sanitized.filter(e => e.topic.trim() && e.value.trim());
          
          if (valid.length === 0) {
            alert("Oops! I couldn't find any valid data in that file. Please make sure the Excel columns match the Lab (Topic, Value, etc.).");
            return;
          }
          
          onImport(valid);
        } catch (err) {
          alert("Error parsing Excel file. The format might be incorrect.");
          console.error(err);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert("Unsupported file format. Please upload JSON or Excel (.xlsx, .xls) files.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Knowledge Matching Lab</h2>
          <p className="text-slate-500">Manage your historical citations and research data points.</p>
        </div>
        <div className="flex flex-wrap gap-2 relative">
          <label className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg cursor-pointer transition flex items-center gap-2 text-sm font-medium shadow-sm">
            <Upload className="w-4 h-4" />
            Import (JSON/Excel)
            <input type="file" className="hidden" accept=".json,.xlsx,.xls" onChange={handleFileUpload} />
          </label>
          
          <div className="relative">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm font-medium shadow-sm"
            >
              <Download className="w-4 h-4" />
              Download
              <ChevronDown className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <button 
                  onClick={handleExportExcel}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm hover:bg-slate-50 transition text-slate-700"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Excel (.xlsx)</span>
                </button>
                <button 
                  onClick={handleExportJSON}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm hover:bg-slate-50 transition text-slate-700 border-t border-slate-100"
                >
                  <FileJson className="w-4 h-4 text-orange-600" />
                  <span>JSON (Backup)</span>
                </button>
              </div>
            )}
          </div>

          <button 
            onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition flex items-center gap-2 text-sm font-bold"
          >
            <Plus className="w-4 h-4" />
            New Entry
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-bold">Automatic Synchronization Enabled</p>
          <p className="opacity-80">All entries are automatically saved to your browser's local storage. For extra safety, use the <strong>Download Backup</strong> button to save a copy to your computer.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="w-5 h-5 text-slate-400" />
            </span>
            <input
              type="text"
              placeholder="Search keyword, country, source, or Report ID..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-100 font-bold">
              <tr>
                <th className="px-6 py-4">Topic / Keyword</th>
                <th className="px-6 py-4 text-center">Report ID</th>
                <th className="px-6 py-4">Value</th>
                <th className="px-6 py-4">Country</th>
                <th className="px-6 py-4">Year</th>
                <th className="px-6 py-4">Source</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.length > 0 ? filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50 transition group">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-semibold text-slate-800">{entry.topic}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">{entry.category}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {entry.reportId ? (
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200 uppercase">
                        {entry.reportId}
                      </span>
                    ) : (
                      <span className="text-slate-300 italic text-xs">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm font-bold">
                      {entry.value} {entry.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{entry.country}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{entry.year}</td>
                  <td className="px-6 py-4 text-slate-600 max-w-xs truncate text-xs">{entry.source}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                      <button 
                        onClick={() => openEditModal(entry)}
                        className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-500 hover:text-blue-600 hover:border-blue-200 transition"
                        title="Edit Entry"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setEntryToDelete(entry)}
                        className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-500 hover:text-red-600 hover:border-red-200 transition"
                        title="Delete Entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <Database className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    No data entries found. Start by adding one or importing a file.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Entry Modal (Add/Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${editingEntry ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}>
                  {editingEntry ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <h3 className="text-xl font-bold text-slate-800">
                  {editingEntry ? 'Edit Citation Entry' : 'New Citation Entry'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Topic / Disease / Metric</label>
                  <input required type="text" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition" value={formData.topic} onChange={e => setFormData({...formData, topic: e.target.value})} placeholder="e.g., Type 2 Diabetes Prevalence" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Report ID</label>
                  <input type="text" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition font-mono text-sm uppercase" value={formData.reportId} onChange={e => setFormData({...formData, reportId: e.target.value})} placeholder="e.g., D25-348" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
                  <select 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition" 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value as any})}
                  >
                    <option value="Epidemiology">Epidemiology</option>
                    <option value="Privacy Metrics">Privacy Metrics</option>
                    <option value="Demographics">Demographics</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Value</label>
                  <input required type="text" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} placeholder="e.g., 8.5" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Unit</label>
                  <input required type="text" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} placeholder="e.g., %" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Country</label>
                  <input required type="text" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} placeholder="e.g., China" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Year</label>
                  <input required type="text" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} placeholder="e.g., 2023" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Source (Citation)</label>
                  <input required type="text" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition" value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} placeholder="URL or Document title" />
                </div>
              </div>
              <div className="pt-6 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={`flex-[2] ${editingEntry ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-3 rounded-xl transition shadow-lg`}
                >
                  {editingEntry ? 'Save Changes' : 'Add to Vault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {entryToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Citation?</h3>
              <p className="text-slate-500 text-sm mb-6">
                Are you sure you want to remove <span className="font-bold text-slate-700">{entryToDelete.topic}</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setEntryToDelete(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition shadow-lg"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
