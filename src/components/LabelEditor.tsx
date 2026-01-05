import { useState } from 'react';
import { Edit2, Check } from 'lucide-react';

interface LabelEditorProps {
  labels: string[];
  setLabels: (labels: string[]) => void;
}

export const LabelEditor = ({ labels, setLabels }: LabelEditorProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(labels[index]);
  };

  const saveEdit = () => {
    if (editingIndex !== null) {
      const newLabels = [...labels];
      newLabels[editingIndex] = editValue || `Option ${editingIndex + 1}`;
      setLabels(newLabels);
      setEditingIndex(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      setEditingIndex(null);
    }
  };

  return (
    <div className="w-full max-w-[600px] mx-auto mb-4">
      <h3
        className="text-center text-sm font-medium mb-2"
        style={{ color: '#ff00ff', textShadow: '0 0 5px #ff00ff' }}
      >
        Click to edit labels (up to 6 options)
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {labels.map((label, index) => (
          <div key={index} className="relative">
            {editingIndex === index ? (
              <div className="flex">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={saveEdit}
                  autoFocus
                  maxLength={20}
                  className="flex-1 px-2 py-1 text-sm rounded-l outline-none"
                  style={{
                    backgroundColor: '#1a1a2e',
                    border: '1px solid #00ffff',
                    color: '#00ffff',
                  }}
                />
                <button
                  onClick={saveEdit}
                  className="px-2 rounded-r"
                  style={{ backgroundColor: '#00ffff', color: '#000' }}
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => startEdit(index)}
                className="w-full px-3 py-2 text-sm rounded flex items-center justify-between gap-2 transition-all hover:scale-105"
                style={{
                  backgroundColor: '#1a1a2e',
                  border: '1px solid #ff00ff',
                  color: '#00ffff',
                  boxShadow: '0 0 10px rgba(255, 0, 255, 0.3)',
                }}
              >
                <span className="truncate">{label}</span>
                <Edit2 className="w-3 h-3 flex-shrink-0 opacity-50" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
