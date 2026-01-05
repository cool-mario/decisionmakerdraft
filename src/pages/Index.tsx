import { useState, useCallback } from 'react';
import { PlinkoBoard } from '@/components/PlinkoBoard';
import { SettingsPanel } from '@/components/SettingsPanel';
import { LabelEditor } from '@/components/LabelEditor';

const DEFAULT_LABELS = ['Yes', 'No', 'Maybe', 'Ask Again', 'Definitely', 'Never'];

const Index = () => {
  const [labels, setLabels] = useState<string[]>(DEFAULT_LABELS);
  const [gravity, setGravity] = useState(1);
  const [bounciness, setBounciness] = useState(0.6);
  const [friction, setFriction] = useState(0.1);
  const [backgroundColor, setBackgroundColor] = useState('#0a0a1a');
  const [winningLabel, setWinningLabel] = useState<string | null>(null);
  const [key, setKey] = useState(0);

  const handleWin = useCallback((index: number) => {
    setWinningLabel(labels[index]);
  }, [labels]);

  // Force remount when physics settings change
  const handleSettingsChange = (
    setter: (v: number) => void,
    value: number
  ) => {
    setter(value);
    setKey((k) => k + 1);
  };

  return (
    <div 
      className="min-h-screen p-4 sm:p-8"
      style={{ backgroundColor }}
    >
      <SettingsPanel
        gravity={gravity}
        setGravity={(v) => handleSettingsChange(setGravity, v)}
        bounciness={bounciness}
        setBounciness={(v) => handleSettingsChange(setBounciness, v)}
        friction={friction}
        setFriction={(v) => handleSettingsChange(setFriction, v)}
        backgroundColor={backgroundColor}
        setBackgroundColor={setBackgroundColor}
      />

      <div className="max-w-2xl mx-auto">
        <h1
          className="text-3xl sm:text-5xl font-bold text-center mb-2"
          style={{
            color: '#ff00ff',
            textShadow: '0 0 20px #ff00ff, 0 0 40px #ff00ff',
          }}
        >
          PLINKO DECIDER
        </h1>
        <p
          className="text-center mb-6 text-sm sm:text-base"
          style={{ color: '#00ffff', textShadow: '0 0 10px #00ffff' }}
        >
          Let physics make your decisions!
        </p>

        {winningLabel && (
          <div
            className="text-center py-3 px-6 rounded-lg mb-4 animate-pulse"
            style={{
              backgroundColor: 'rgba(0, 255, 255, 0.2)',
              border: '2px solid #00ffff',
              boxShadow: '0 0 30px rgba(0, 255, 255, 0.5)',
            }}
          >
            <span
              className="text-xl sm:text-2xl font-bold"
              style={{ color: '#00ffff', textShadow: '0 0 15px #00ffff' }}
            >
              🎉 {winningLabel}! 🎉
            </span>
          </div>
        )}

        <LabelEditor labels={labels} setLabels={setLabels} />

        <PlinkoBoard
          key={key}
          labels={labels}
          gravity={gravity}
          bounciness={bounciness}
          friction={friction}
          backgroundColor={backgroundColor}
          onWin={handleWin}
        />
      </div>
    </div>
  );
};

export default Index;
