import { useState } from 'react';
import { Settings, X } from 'lucide-react';

interface SettingsPanelProps {
  gravity: number;
  setGravity: (v: number) => void;
  bounciness: number;
  setBounciness: (v: number) => void;
  friction: number;
  setFriction: (v: number) => void;
  backgroundColor: string;
  setBackgroundColor: (v: string) => void;
}

const BACKGROUND_COLORS = [
  { name: 'Midnight', value: '#0a0a1a' },
  { name: 'Deep Purple', value: '#1a0a2e' },
  { name: 'Dark Teal', value: '#0a1a1a' },
  { name: 'Charcoal', value: '#1a1a1a' },
  { name: 'Navy', value: '#0a0a2e' },
  { name: 'Dark Red', value: '#1a0a0a' },
];

export const SettingsPanel = ({
  gravity,
  setGravity,
  bounciness,
  setBounciness,
  friction,
  setFriction,
  backgroundColor,
  setBackgroundColor,
}: SettingsPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-50 p-3 rounded-full"
        style={{
          backgroundColor: '#ff00ff',
          boxShadow: '0 0 20px rgba(255, 0, 255, 0.7)',
        }}
      >
        <Settings className="w-6 h-6 text-black" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div
            className="relative w-full max-w-md p-6 rounded-lg"
            style={{
              backgroundColor: '#1a1a2e',
              border: '2px solid #ff00ff',
              boxShadow: '0 0 30px rgba(255, 0, 255, 0.5)',
            }}
          >
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4"
              style={{ color: '#00ffff' }}
            >
              <X className="w-6 h-6" />
            </button>

            <h2
              className="text-2xl font-bold mb-6"
              style={{ color: '#00ffff', textShadow: '0 0 10px #00ffff' }}
            >
              Settings
            </h2>

            <div className="space-y-6">
              {/* Gravity */}
              <div>
                <label className="block mb-2 text-sm font-medium" style={{ color: '#ff00ff' }}>
                  Gravity: {gravity.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="2"
                  step="0.1"
                  value={gravity}
                  onChange={(e) => setGravity(parseFloat(e.target.value))}
                  className="w-full accent-pink-500"
                />
              </div>

              {/* Bounciness */}
              <div>
                <label className="block mb-2 text-sm font-medium" style={{ color: '#ff00ff' }}>
                  Bounciness: {bounciness.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="2"
                  step="0.05"
                  value={bounciness}
                  onChange={(e) => setBounciness(parseFloat(e.target.value))}
                  className="w-full accent-pink-500"
                />
              </div>

              {/* Friction */}
              <div>
                <label className="block mb-2 text-sm font-medium" style={{ color: '#ff00ff' }}>
                  Friction: {friction.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.05"
                  value={friction}
                  onChange={(e) => setFriction(parseFloat(e.target.value))}
                  className="w-full accent-pink-500"
                />
              </div>

              {/* Background Color */}
              <div>
                <label className="block mb-2 text-sm font-medium" style={{ color: '#ff00ff' }}>
                  Background Color
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {BACKGROUND_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setBackgroundColor(color.value)}
                      className={`p-3 rounded text-xs font-medium transition-all ${
                        backgroundColor === color.value ? 'ring-2 ring-cyan-400' : ''
                      }`}
                      style={{
                        backgroundColor: color.value,
                        color: '#00ffff',
                        border: '1px solid #ff00ff',
                      }}
                    >
                      {color.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
