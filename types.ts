
export interface DataEntry {
  id: string;
  topic: string;
  value: string;
  unit: string;
  country: string;
  year: string;
  source: string;
  category: 'Epidemiology' | 'Privacy Metrics' | 'Demographics' | 'Other';
  reportId?: string; // New field for identifying the report (e.g., D25-348)
  notes?: string;
  dateAdded: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  relatedData?: DataEntry[];
}

export type ViewType = 'chat' | 'knowledge-base' | 'dashboard' | 'extraction';
