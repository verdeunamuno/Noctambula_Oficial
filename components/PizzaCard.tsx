
import React, { useState } from 'react';
import { Trash2, Pizza as PizzaIcon, TrendingUp, List, AlertCircle, EyeOff } from 'lucide-react';
import { Pizza, IngredientCost, AppSettings } from '../types';

interface PizzaCardProps {
  pizza: Pizza;
  ingredientsCosts: IngredientCost[];
  settings: AppSettings;
  isGlovoMode: boolean;
  isLabMode?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

const PizzaCard: React.FC<PizzaCardProps> = ({ pizza, ingredientsCosts, settings, isGlovoMode, isLabMode, onEdit, onDelete }) => {
  const [showIngredientsTooltip, setShowIngredientsTooltip] = useState(false);

  const hasErrors = pizza.ingredients.some(ing => {
    const dbItem = ingredientsCosts.find(db => db.name.toLowerCase() === ing.name.toLowerCase());
    return !dbItem || dbItem.pricePerUnit === 0;
  });

  const calculateTotalCost = () => {
    return pizza.ingredients.reduce((acc, ing) => {
      const dbItem = ingredientsCosts.find(db => db.name.toLowerCase() === ing.name.toLowerCase());
      if (!dbItem) return acc;
      return acc + (Number(ing.amount) * dbItem.pricePerUnit);
    }, 0);
  };

  const cost = calculateTotalCost();
  const salePriceWithIVA = pizza.salePrice || 0;
  
  let profit = 0;
  let marginPercent = 0;
  
  if (salePriceWithIVA > 0) {
    const basePrice = salePriceWithIVA / 1.10;
    if (isGlovoMode) {
      const glovoCommissionAmount = salePriceWithIVA * (settings.glovoCommission / 100);
      profit = basePrice - glovoCommissionAmount - cost;
      marginPercent = (profit / basePrice) * 100;
    } else {
      profit = basePrice - cost;
      marginPercent = (profit / basePrice) * 100;
    }
  }

  return (
    <div 
      onClick={onEdit}
      className={`group bg-zinc-900/80 backdrop-blur-md rounded-[2.5rem] shadow-xl border ${pizza.isActive ? 'border-zinc-800' : 'border-zinc-800 opacity-60'} ${isLabMode ? 'hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.1)]' : 'hover:border-noctambula/50'} hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer relative ${showIngredientsTooltip ? 'z-[100]' : 'z-10'}`}
    >
      {isGlovoMode && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest z-[60] shadow-lg animate-pulse">
          Modo Glovo Activo
        </div>
      )}

      <div className="p-8 pb-0">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div 
              onMouseEnter={() => setShowIngredientsTooltip(true)}
              onMouseLeave={() => setShowIngredientsTooltip(false)}
              className={`relative flex items-center justify-center w-12 h-12 ${pizza.isActive ? (isLabMode ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-noctambula text-black') : 'bg-zinc-700 text-zinc-400'} font-black rounded-2xl text-lg shadow-lg z-[110] transition-transform hover:rotate-6 cursor-help`}
            >
              {pizza.number}

              {showIngredientsTooltip && (
                <div className="absolute top-full left-0 mt-4 w-max min-w-[14rem] bg-zinc-950 text-white p-4 rounded-2xl shadow-2xl z-[200] border border-zinc-800 animate-in fade-in zoom-in duration-200 pointer-events-none rotate-[-3deg] origin-top-left">
                  <div className="flex items-center gap-2 mb-2.5 border-b border-zinc-800 pb-2">
                    <List className={`w-3 h-3 ${isLabMode ? 'text-purple-400' : 'text-noctambula'}`} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Receta Interna</span>
                  </div>
                  <div className="space-y-1.5 max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar">
                    {pizza.ingredients.map((ing, idx) => (
                      <div key={idx} className="flex justify-between items-center gap-4">
                        <span className="text-[10px] font-bold uppercase truncate flex-1">{ing.name}</span>
                        <span className={`text-[9px] font-black ${isLabMode ? 'text-purple-400' : 'text-noctambula'} shrink-0`}>{ing.amount}{ing.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="relative">
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none mb-1">{pizza.name}</h3>
                {!pizza.isActive && (
                  <span title="Pizza Desactivada">
                    <EyeOff className="w-4 h-4 text-zinc-600" />
                  </span>
                )}
                {hasErrors && (
                  <div className="flex items-center justify-center bg-red-600/30 p-2 rounded-full animate-pulse border border-red-600/60 shadow-[0_0_20px_rgba(220,38,38,0.7)] ml-1">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                {salePriceWithIVA > 0 ? (
                  <>
                    <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${marginPercent > 20 ? (isGlovoMode ? 'text-yellow-500' : (isLabMode ? 'text-purple-400' : 'text-noctambula')) : 'text-red-500'}`}>
                      <TrendingUp className="w-3 h-3" /> {isGlovoMode ? `M. Glovo (${settings.glovoCommission}%):` : 'Margen:'} {marginPercent.toFixed(1)}%
                    </span>
                    <span className="text-white text-[11px] font-black uppercase tracking-widest mt-1">
                      Beneficio: {profit.toFixed(settings.decimals)}{settings.currency}
                    </span>
                  </>
                ) : (
                  <span className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">Sin PVP definido</span>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-3 text-zinc-700 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        <div className={`bg-zinc-950/50 -mx-8 px-8 py-6 border-t border-zinc-800 flex items-center justify-between transition-all duration-500 rounded-b-[2.5rem]`}>
          <div className="flex flex-col">
            <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isGlovoMode ? 'text-yellow-600' : (isLabMode ? 'text-purple-600 font-bold' : 'text-zinc-500 group-hover:text-[#ea580c]')}`}>
              {isGlovoMode ? 'Producción vs Neto Glovo' : 'Producción vs PVP'}
            </span>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-black text-white transition-all ${!isGlovoMode && !isLabMode && 'group-hover:text-[#ea580c]'}`}>{cost.toFixed(settings.decimals)}</span>
              <span className={`font-bold text-xs transition-colors ${isGlovoMode ? 'text-yellow-900' : 'text-zinc-700 group-hover:text-[#ea580c]/30'}`}>/</span>
              <span className={`text-2xl font-black transition-all ${isGlovoMode ? 'text-yellow-500' : (isLabMode ? 'text-purple-400 font-black' : 'text-noctambula group-hover:text-[#ea580c]')}`}>{salePriceWithIVA.toFixed(settings.decimals)}{settings.currency}</span>
            </div>
          </div>
          <div className={`w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center transition-all ${isLabMode ? 'shadow-[0_0_15px_rgba(168,85,247,0.1)] border border-purple-500/20' : ''}`}>
            <PizzaIcon className={`w-7 h-7 transition-colors ${isGlovoMode ? 'text-yellow-500' : (isLabMode ? 'text-purple-500 animate-pulse' : 'text-noctambula group-hover:text-[#ea580c]')}`} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PizzaCard;
