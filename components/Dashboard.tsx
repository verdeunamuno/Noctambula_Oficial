
import React from 'react';
import { X, BarChart3, TrendingUp, DollarSign, Award, Target, Calculator, PieChart, Euro } from 'lucide-react';
import { Pizza, IngredientCost, AppSettings } from '../types';

interface DashboardProps {
  isOpen: boolean;
  onClose: () => void;
  pizzas: Pizza[];
  ingredientsCosts: IngredientCost[];
  settings: AppSettings;
  isGlovoMode?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ isOpen, onClose, pizzas, ingredientsCosts, settings, isGlovoMode }) => {
  const activePizzas = pizzas.filter(p => p.isActive !== false);
  
  const pizzaStats = activePizzas.map(p => {
    const cost = p.ingredients.reduce((acc, ing) => {
      const dbItem = ingredientsCosts.find(db => db.name.toLowerCase() === ing.name.toLowerCase());
      return acc + (Number(ing.amount) * (dbItem?.pricePerUnit || 0));
    }, 0);
    const salePriceWithIVA = p.salePrice || 0;
    
    let profit = 0;
    let margin = 0;
    let basePrice = 0;

    if (salePriceWithIVA > 0) {
      basePrice = salePriceWithIVA / 1.10;
      
      if (isGlovoMode) {
        // Nueva fórmula: Base Imponible - Comisión Glovo (del PVP) - Costo
        const glovoFee = salePriceWithIVA * (settings.glovoCommission / 100);
        profit = basePrice - glovoFee - cost;
        margin = (profit / basePrice) * 100;
      } else {
        // Modo Normal: Base Imponible - Costo
        profit = basePrice - cost;
        margin = (profit / basePrice) * 100;
      }
    }
    
    return { name: p.name, cost, salePrice: salePriceWithIVA, profit, margin };
  });

  const avgCost = pizzaStats.length > 0 ? pizzaStats.reduce((acc, p) => acc + p.cost, 0) / pizzaStats.length : 0;
  const avgMargin = pizzaStats.filter(p => p.salePrice > 0).length > 0 
    ? pizzaStats.filter(p => p.salePrice > 0).reduce((acc, p) => acc + p.margin, 0) / pizzaStats.filter(p => p.salePrice > 0).length 
    : 0;

  const maxCost = Math.max(...pizzaStats.map(p => p.cost), 1);
  const maxProfit = Math.max(...pizzaStats.map(p => p.profit), 1);
  
  const sortedByProfit = [...pizzaStats].sort((a, b) => b.margin - a.margin);
  const bestPizza = sortedByProfit[0];
  const sortedByAbsoluteProfit = [...pizzaStats].sort((a, b) => b.profit - a.profit);
  const topMoneyMaker = sortedByAbsoluteProfit[0];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
      <div className="bg-zinc-950 w-full max-w-6xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-zinc-800 animate-in zoom-in duration-300">
        <div className={`px-8 py-6 flex items-center justify-between transition-colors duration-500 ${isGlovoMode ? 'bg-yellow-500/10' : 'bg-zinc-900'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${isGlovoMode ? 'bg-yellow-500 text-black' : 'bg-noctambula text-black'}`}>
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Panel de Rentabilidad Noctámbula</h2>
              {isGlovoMode && <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest">Vista: Análisis Glovo ({settings.glovoCommission}%)</span>}
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X className="w-8 h-8" /></button>
        </div>

        <div className="p-8 flex-1 overflow-y-auto space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-zinc-900 p-6 rounded-[2rem] border border-zinc-800">
              <div className="flex items-center gap-3 text-zinc-500 mb-2">
                <Calculator className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Coste Medio</span>
              </div>
              <div className="text-3xl font-black text-white">{avgCost.toFixed(settings.decimals)}{settings.currency}</div>
            </div>
            <div className={`p-6 rounded-[2rem] border transition-colors ${isGlovoMode ? 'bg-yellow-500/5 border-yellow-500/20 text-yellow-500' : 'bg-noctambula/5 border-noctambula/20 text-noctambula'}`}>
              <div className="flex items-center gap-3 mb-2 opacity-60">
                <Target className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Margen Medio {isGlovoMode ? 'Glovo' : ''}</span>
              </div>
              <div className="text-3xl font-black">{avgMargin.toFixed(1)}%</div>
            </div>
            <div className="bg-zinc-900 p-6 rounded-[2rem] border border-zinc-800">
              <div className="flex items-center gap-3 text-zinc-500 mb-2">
                <Euro className={`w-4 h-4 ${isGlovoMode ? 'text-yellow-500' : 'text-noctambula'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest">Top Dinero Neto</span>
              </div>
              <div className="text-xl font-black uppercase truncate text-white">{topMoneyMaker?.name || '---'}</div>
              <div className={`text-sm font-bold ${isGlovoMode ? 'text-yellow-500' : 'text-noctambula'}`}>+{topMoneyMaker?.profit.toFixed(2)}{settings.currency}/u</div>
            </div>
            <div className={`p-6 rounded-[2rem] text-black shadow-xl transition-colors ${isGlovoMode ? 'bg-yellow-500' : 'bg-noctambula'}`}>
              <div className="flex items-center gap-3 text-black/40 mb-2">
                <Award className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Top Margen %</span>
              </div>
              <div className="text-xl font-black uppercase truncate">{bestPizza?.name || '---'}</div>
              <div className="text-sm font-bold opacity-70">{bestPizza?.margin.toFixed(1)}% de beneficio</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-8">
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-8 flex items-center gap-3">
                <PieChart className={`w-4 h-4 ${isGlovoMode ? 'text-yellow-500' : 'text-noctambula'}`} /> Coste de Producción por Modelo
              </h3>
              <div className="space-y-6">
                {pizzaStats.map((p, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-black text-white uppercase truncate">{p.name}</span>
                      <span className="text-[10px] font-bold text-zinc-300">{p.cost.toFixed(settings.decimals)}{settings.currency}</span>
                    </div>
                    <div className="h-4 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                      <div className="h-full bg-zinc-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(161,161,170,0.2)]" style={{ width: `${(p.cost / maxCost) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-8">
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-8 flex items-center gap-3">
                <TrendingUp className={`w-4 h-4 ${isGlovoMode ? 'text-yellow-500' : 'text-noctambula'}`} /> Ranking {isGlovoMode ? 'Neto Glovo' : 'Beneficio Directo'}
              </h3>
              <div className="space-y-6">
                {sortedByAbsoluteProfit.map((p, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-zinc-600">#{idx + 1}</span>
                        <span className="text-xs font-black text-white uppercase truncate">{p.name}</span>
                      </div>
                      <span className={`text-[10px] font-bold ${isGlovoMode ? 'text-yellow-500' : 'text-noctambula'}`}>{p.profit.toFixed(settings.decimals)}{settings.currency}</span>
                    </div>
                    <div className="h-4 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${isGlovoMode ? 'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-noctambula shadow-[0_0_15px_rgba(254,240,30,0.3)]'}`}
                        style={{ width: `${(p.profit / maxProfit) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
