import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MousePointer2, 
  ArrowUpCircle,
  RefreshCw
} from 'lucide-react';

interface LevelConfig {
  level: number;
  perClick: number;
  cost: number;
}

const LEVELS: LevelConfig[] = [
  { level: 1, perClick: 1, cost: 50 },
  { level: 2, perClick: 2, cost: 500 },
  { level: 3, perClick: 5, cost: 5000 },
];

export default function App() {
  const [clicks, setClicks] = useState<number>(() => {
    const saved = localStorage.getItem('clickup_clicks_v01');
    return saved ? parseFloat(saved) : 0;
  });
  
  const [currentLevel, setCurrentLevel] = useState<number>(() => {
    const saved = localStorage.getItem('clickup_level_v01');
    return saved ? parseInt(saved) : 0;
  });

  const [floatingTexts, setFloatingTexts] = useState<{ id: number, x: number, y: number, text: string }[]>([]);

  // Calculate current perClick rate
  const getPerClick = () => {
    if (currentLevel === 0) return 0.5;
    const levelData = LEVELS.find(l => l.level === currentLevel);
    return levelData ? levelData.perClick : 0.5;
  };

  const perClick = getPerClick();
  const nextLevelData = LEVELS.find(l => l.level === currentLevel + 1);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('clickup_clicks_v01', clicks.toString());
    localStorage.setItem('clickup_level_v01', currentLevel.toString());
  }, [clicks, currentLevel]);

  const handleMainClick = (e: React.MouseEvent) => {
    const newClicks = clicks + perClick;
    setClicks(newClicks);
    
    // Floating text effect
    const id = Date.now();
    setFloatingTexts(prev => [...prev, { id, x: e.clientX, y: e.clientY, text: `+${perClick}` }]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(t => t.id !== id));
    }, 1000);
  };

  const upgradeLevel = () => {
    if (nextLevelData && clicks >= nextLevelData.cost) {
      setClicks(clicks - nextLevelData.cost);
      setCurrentLevel(currentLevel + 1);
    }
  };

  const resetGame = () => {
    if (confirm('Сбросить прогресс?')) {
      setClicks(0);
      setCurrentLevel(0);
      localStorage.removeItem('clickup_clicks_v01');
      localStorage.removeItem('clickup_level_v01');
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white font-sans overflow-x-hidden selection:bg-indigo-500/30">
      {/* Floating Click Texts */}
      {floatingTexts.map(t => (
        <motion.div
          key={t.id}
          initial={{ opacity: 1, y: t.y, x: t.x }}
          animate={{ opacity: 0, y: t.y - 100 }}
          className="fixed pointer-events-none z-50 font-black text-2xl text-indigo-400 select-none"
        >
          {t.text}
        </motion.div>
      ))}

      <main className="max-w-4xl mx-auto px-6 py-12 flex flex-col items-center">
        {/* Header */}
        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <MousePointer2 size={20} />
            </div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">ClickUP <span className="text-indigo-500 text-xl not-italic ml-1">0.1</span></h1>
          </div>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Простая версия</p>
        </header>

        {/* Main Stats */}
        <div className="mb-16 text-center">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">Баланс кликов</div>
          <div className="text-7xl font-black text-white tabular-nums tracking-tighter">
            {clicks % 1 === 0 ? clicks.toLocaleString() : clicks.toFixed(1)}
          </div>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 rounded-full border border-indigo-500/20">
            <span className="text-xs font-black uppercase text-indigo-400">Уровень {currentLevel}</span>
            <div className="w-1 h-1 rounded-full bg-indigo-500/40" />
            <span className="text-xs font-bold text-slate-400">{perClick} за клик</span>
          </div>
        </div>

        {/* The Button */}
        <div className="relative mb-20">
          <div className="absolute inset-0 bg-indigo-500 blur-[80px] opacity-10" />
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleMainClick}
            className="relative w-64 h-64 bg-indigo-600 rounded-[3.5rem] flex items-center justify-center shadow-[0_15px_40px_rgba(79,70,229,0.4)] border-b-8 border-indigo-800 active:border-b-0 active:translate-y-2 transition-all"
          >
            <MousePointer2 size={80} className="text-white drop-shadow-lg" />
          </motion.button>
        </div>

        {/* Upgrade Button */}
        <div className="w-full max-w-xs">
          {nextLevelData ? (
            <button 
              onClick={upgradeLevel}
              disabled={clicks < nextLevelData.cost}
              className={`
                w-full p-6 rounded-3xl border-2 flex flex-col items-center gap-2 transition-all
                ${clicks >= nextLevelData.cost 
                  ? 'bg-white text-black border-white hover:scale-105 shadow-xl' 
                  : 'bg-slate-800/50 text-slate-500 border-white/5 opacity-50 cursor-not-allowed'}
              `}
            >
              <ArrowUpCircle size={24} />
              <div className="font-black uppercase tracking-tighter text-lg">Повысить уровень</div>
              <div className="text-xs font-bold opacity-70">Цена: {nextLevelData.cost} кликов</div>
            </button>
          ) : (
            <div className="w-full p-6 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/20 text-emerald-400 text-center">
              <div className="font-black uppercase tracking-tighter text-lg">Макс. уровень достигнут</div>
              <div className="text-xs font-bold opacity-70">Ждите обновлений</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-24 pt-8 border-t border-white/5 w-full flex justify-center">
          <button 
            onClick={resetGame}
            className="flex items-center gap-2 text-slate-600 hover:text-rose-500 transition-colors font-bold uppercase tracking-widest text-[10px]"
          >
            <RefreshCw size={12} />
            Сброс
          </button>
        </footer>
      </main>
    </div>
  );
}
