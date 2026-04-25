import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MousePointer2, 
  ArrowUpCircle,
  RefreshCw,
  ShoppingBag,
  Zap,
  Timer,
  Sparkles,
  X
} from 'lucide-react';

interface LevelConfig {
  level: number;
  perClick: number;
  cost: number;
}

interface ShopItem {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  baseCost: number;
  effect: number;
  type: 'multiplier' | 'autoclick' | 'bonus';
}

const LEVELS: LevelConfig[] = [
  { level: 1, perClick: 1, cost: 50 },
  { level: 2, perClick: 2, cost: 500 },
  { level: 3, perClick: 5, cost: 5000 },
  { level: 4, perClick: 10, cost: 25000 },
  { level: 5, perClick: 25, cost: 100000 },
];

const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'multiplier',
    name: 'Множитель x2',
    description: 'Удваивает клики',
    icon: <Zap size={24} />,
    baseCost: 100,
    effect: 2,
    type: 'multiplier'
  },
  {
    id: 'autoclick',
    name: 'Авто-клик',
    description: '+1 клик/сек',
    icon: <Timer size={24} />,
    baseCost: 500,
    effect: 1,
    type: 'autoclick'
  },
  {
    id: 'bonus',
    name: 'Бонус кликов',
    description: '+10 кликов сразу',
    icon: <Sparkles size={24} />,
    baseCost: 50,
    effect: 10,
    type: 'bonus'
  },
];

export default function App() {
  const [clicks, setClicks] = useState<number>(() => {
    const saved = localStorage.getItem('clickup_clicks_v02');
    return saved ? parseFloat(saved) : 0;
  });
  
  const [currentLevel, setCurrentLevel] = useState<number>(() => {
    const saved = localStorage.getItem('clickup_level_v02');
    return saved ? parseInt(saved) : 0;
  });

  const [multiplier, setMultiplier] = useState<number>(() => {
    const saved = localStorage.getItem('clickup_multiplier_v02');
    return saved ? parseInt(saved) : 1;
  });

  const [autoClickRate, setAutoClickRate] = useState<number>(() => {
    const saved = localStorage.getItem('clickup_autoclick_v02');
    return saved ? parseInt(saved) : 0;
  });

  const [purchases, setPurchases] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('clickup_purchases_v02');
    return saved ? JSON.parse(saved) : {};
  });

  const [floatingTexts, setFloatingTexts] = useState<{ id: number, x: number, y: number, text: string }[]>([]);
  const [showShop, setShowShop] = useState(false);

  // Calculate current perClick rate
  const getPerClick = () => {
    let base = 0.5;
    if (currentLevel > 0) {
      const levelData = LEVELS.find(l => l.level === currentLevel);
      base = levelData ? levelData.perClick : 0.5;
    }
    return base * multiplier;
  };

  const perClick = getPerClick();
  const nextLevelData = LEVELS.find(l => l.level === currentLevel + 1);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('clickup_clicks_v02', clicks.toString());
    localStorage.setItem('clickup_level_v02', currentLevel.toString());
    localStorage.setItem('clickup_multiplier_v02', multiplier.toString());
    localStorage.setItem('clickup_autoclick_v02', autoClickRate.toString());
    localStorage.setItem('clickup_purchases_v02', JSON.stringify(purchases));
  }, [clicks, currentLevel, multiplier, autoClickRate, purchases]);

  // Auto-click effect
  useEffect(() => {
    if (autoClickRate > 0) {
      const interval = setInterval(() => {
        setClicks(prev => prev + autoClickRate);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [autoClickRate]);

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

  const getItemCost = (item: ShopItem) => {
    const timesPurchased = purchases[item.id] || 0;
    return Math.floor(item.baseCost * Math.pow(1.5, timesPurchased));
  };

  const buyItem = (item: ShopItem) => {
    const cost = getItemCost(item);
    if (clicks >= cost) {
      setClicks(clicks - cost);
      setPurchases(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
      
      switch (item.type) {
        case 'multiplier':
          setMultiplier(prev => prev * item.effect);
          break;
        case 'autoclick':
          setAutoClickRate(prev => prev + item.effect);
          break;
        case 'bonus':
          setClicks(prev => prev + item.effect);
          break;
      }
    }
  };

  const resetGame = () => {
    if (confirm('Сбросить прогресс?')) {
      setClicks(0);
      setCurrentLevel(0);
      setMultiplier(1);
      setAutoClickRate(0);
      setPurchases({});
      localStorage.removeItem('clickup_clicks_v02');
      localStorage.removeItem('clickup_level_v02');
      localStorage.removeItem('clickup_multiplier_v02');
      localStorage.removeItem('clickup_autoclick_v02');
      localStorage.removeItem('clickup_purchases_v02');
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

      {/* Shop Modal */}
      <AnimatePresence>
        {showShop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center p-4"
            onClick={() => setShowShop(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 rounded-3xl p-6 w-full max-w-md border border-white/10"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                    <ShoppingBag size={20} />
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Магазин</h2>
                </div>
                <button 
                  onClick={() => setShowShop(false)}
                  className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mb-4 px-4 py-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ваш баланс</div>
                <div className="text-2xl font-black text-white">{Math.floor(clicks).toLocaleString()} кликов</div>
              </div>

              <div className="space-y-3">
                {SHOP_ITEMS.map(item => {
                  const cost = getItemCost(item);
                  const canAfford = clicks >= cost;
                  const timesPurchased = purchases[item.id] || 0;

                  return (
                    <button
                      key={item.id}
                      onClick={() => buyItem(item)}
                      disabled={!canAfford}
                      className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all text-left ${
                        canAfford 
                          ? 'bg-slate-800 border-white/10 hover:border-indigo-500/50 hover:bg-slate-800/80' 
                          : 'bg-slate-900/50 border-white/5 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        item.type === 'multiplier' ? 'bg-amber-500/20 text-amber-400' :
                        item.type === 'autoclick' ? 'bg-emerald-500/20 text-emerald-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-white">{item.name}</div>
                        <div className="text-xs text-slate-500">{item.description}</div>
                        {timesPurchased > 0 && (
                          <div className="text-xs text-indigo-400 mt-1">Куплено: {timesPurchased}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className={`font-black ${canAfford ? 'text-white' : 'text-slate-600'}`}>
                          {cost.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-500">кликов</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-4xl mx-auto px-6 py-12 flex flex-col items-center">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <MousePointer2 size={20} />
            </div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">ClickUP <span className="text-indigo-500 text-xl not-italic ml-1">0.2</span></h1>
          </div>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">С магазином</p>
        </header>

        {/* Stats Row */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {multiplier > 1 && (
            <div className="px-4 py-2 bg-amber-500/10 rounded-full border border-amber-500/20 flex items-center gap-2">
              <Zap size={14} className="text-amber-400" />
              <span className="text-xs font-bold text-amber-400">x{multiplier}</span>
            </div>
          )}
          {autoClickRate > 0 && (
            <div className="px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20 flex items-center gap-2">
              <Timer size={14} className="text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400">+{autoClickRate}/сек</span>
            </div>
          )}
        </div>

        {/* Main Stats */}
        <div className="mb-12 text-center">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">Баланс кликов</div>
          <div className="text-7xl font-black text-white tabular-nums tracking-tighter">
            {clicks % 1 === 0 ? Math.floor(clicks).toLocaleString() : clicks.toFixed(1)}
          </div>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 rounded-full border border-indigo-500/20">
            <span className="text-xs font-black uppercase text-indigo-400">Уровень {currentLevel}</span>
            <div className="w-1 h-1 rounded-full bg-indigo-500/40" />
            <span className="text-xs font-bold text-slate-400">{perClick} за клик</span>
          </div>
        </div>

        {/* The Button */}
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-indigo-500 blur-[80px] opacity-10" />
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleMainClick}
            className="relative w-56 h-56 bg-indigo-600 rounded-[3rem] flex items-center justify-center shadow-[0_15px_40px_rgba(79,70,229,0.4)] border-b-8 border-indigo-800 active:border-b-0 active:translate-y-2 transition-all"
          >
            <MousePointer2 size={72} className="text-white drop-shadow-lg" />
          </motion.button>
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-sm space-y-3">
          {/* Shop Button */}
          <button
            onClick={() => setShowShop(true)}
            className="w-full p-5 rounded-2xl bg-amber-500 text-black border-2 border-amber-400 flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform shadow-lg"
          >
            <ShoppingBag size={22} />
            <span className="font-black uppercase tracking-tight text-lg">Магазин</span>
          </button>

          {/* Upgrade Button */}
          {nextLevelData ? (
            <button 
              onClick={upgradeLevel}
              disabled={clicks < nextLevelData.cost}
              className={`
                w-full p-5 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all
                ${clicks >= nextLevelData.cost 
                  ? 'bg-white text-black border-white hover:scale-[1.02] shadow-xl' 
                  : 'bg-slate-800/50 text-slate-500 border-white/5 opacity-50 cursor-not-allowed'}
              `}
            >
              <div className="flex items-center gap-2">
                <ArrowUpCircle size={20} />
                <span className="font-black uppercase tracking-tight">Уровень {currentLevel + 1}</span>
              </div>
              <div className="text-xs font-bold opacity-70">Цена: {nextLevelData.cost.toLocaleString()} кликов</div>
            </button>
          ) : (
            <div className="w-full p-5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/20 text-emerald-400 text-center">
              <div className="font-black uppercase tracking-tight">Макс. уровень</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-6 border-t border-white/5 w-full flex justify-center">
          <button 
            onClick={resetGame}
            className="flex items-center gap-2 text-slate-600 hover:text-rose-500 transition-colors font-bold uppercase tracking-widest text-[10px]"
          >
            <RefreshCw size={12} />
            Сброс прогресса
          </button>
        </footer>
      </main>
    </div>
  );
}
