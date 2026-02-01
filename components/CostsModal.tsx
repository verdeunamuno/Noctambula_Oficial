
import React, { useState, useRef } from 'react';
import { X, Plus, Trash2, FileUp, FileDown, Search, Calculator, Edit2, Check, ShoppingBag, Eye, EyeOff } from 'lucide-react';
import { IngredientCost, AppSettings, Unit } from '../types';
import * as XLSX from 'xlsx';

interface CostsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredients: IngredientCost[];
  setIngredients: React.Dispatch<React.SetStateAction<IngredientCost[]>>;
  settings: AppSettings;
}

const CostsModal: React.FC<CostsModalProps> = ({ isOpen, onClose, ingredients, setIngredients, settings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{id: string, name: string} | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [editValues, setEditValues] = useState<{ name: string; unit: Unit; price: string; salePrice: string; showInSales: boolean } | null>(null);
  const [newIngredient, setNewIngredient] = useState<{ name: string; unit: Unit; price: string; salePrice: string; showInSales: boolean }>({ name: '', unit: 'Kg', price: '', salePrice: '', showInSales: false });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = ingredients.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())).sort((a,b) => a.name.localeCompare(b.name));

  const handleAdd = () => {
    if (!newIngredient.name) return;
    const item: IngredientCost = { 
      id: crypto.randomUUID(), 
      name: newIngredient.name.trim().toUpperCase(), 
      unit: newIngredient.unit, 
      pricePerUnit: parseFloat(newIngredient.price) || 0,
      defaultSalePrice: parseFloat(newIngredient.salePrice) || 0,
      showInSales: newIngredient.showInSales
    };
    setIngredients([...ingredients, item]);
    setNewIngredient({ name: '', unit: 'Kg', price: '', salePrice: '', showInSales: false });
    setIsAdding(false);
  };

  const executeDelete = () => {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete.id);
    setTimeout(() => {
      setIngredients(ingredients.filter(i => i.id !== confirmDelete.id));
      setDeletingId(null);
      setConfirmDelete(null);
    }, 400);
  };

  const handleExport = () => {
    try {
      const wb = XLSX.utils.book_new();
      const headers = ['INGREDIENTE', 'UNIDAD', 'PRECIO_COMPRA', 'PVP_VENTA_EXTRA', 'VENTA_ACTIVA'];
      const data = ingredients.map(i => [i.name.toUpperCase(), i.unit, i.pricePerUnit, i.defaultSalePrice || 0, i.showInSales ? 'SI' : 'NO']);
      const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
      XLSX.utils.book_append_sheet(wb, ws, "COSTES");
      XLSX.writeFile(wb, "Costes_Noctambula.xlsx");
    } catch(e) { alert("Error al exportar costes."); }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const ws = workbook.Sheets[workbook.SheetNames[0]];
        if (!ws) throw new Error("No hay datos en la hoja.");
        
        const rawRows = XLSX.utils.sheet_to_json(ws) as any[];
        
        const newItems: IngredientCost[] = rawRows.map(row => {
          // Normalización de claves
          const normalizedRow: any = {};
          Object.keys(row).forEach(key => {
            normalizedRow[key.trim().toUpperCase()] = row[key];
          });

          return {
            id: crypto.randomUUID(),
            name: String(normalizedRow['INGREDIENTE'] || normalizedRow['NOMBRE'] || '').trim().toUpperCase(),
            unit: (String(normalizedRow['UNIDAD'] || 'Kg').toUpperCase().includes('L') ? 'L' : (String(normalizedRow['UNIDAD'] || '').toUpperCase().includes('UD') ? 'Ud' : 'Kg')) as Unit,
            pricePerUnit: parseFloat(normalizedRow['PRECIO_COMPRA'] || normalizedRow['PRECIO'] || 0),
            defaultSalePrice: parseFloat(normalizedRow['PVP_VENTA_EXTRA'] || normalizedRow['PVP'] || 0),
            showInSales: String(normalizedRow['VENTA_ACTIVA'] || '').toUpperCase() === 'SI'
          };
        }).filter(item => item.name !== '');

        if (newItems.length === 0) {
          alert("⚠️ No se encontraron ingredientes válidos en el archivo.");
          return;
        }

        setIngredients(prev => {
          const merged = [...prev];
          newItems.forEach(item => {
            const index = merged.findIndex(m => m.name.toLowerCase() === item.name.toLowerCase());
            if (index !== -1) {
              merged[index] = { 
                ...merged[index], 
                pricePerUnit: item.pricePerUnit, 
                unit: item.unit, 
                defaultSalePrice: item.defaultSalePrice, 
                showInSales: item.showInSales 
              };
            } else {
              merged.push(item);
            }
          });
          return merged;
        });
        alert(`✅ Éxito: ${newItems.length} ingredientes procesados.`);
      } catch(e) { 
        console.error(e);
        alert("❌ Error al importar el archivo Excel."); 
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const toggleVisibility = (id: string) => {
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, showInSales: !i.showInSales } : i));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
        <div className="px-8 py-6 bg-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-900/40"><Calculator className="text-white w-6 h-6" /></div>
            <h2 className="text-xl font-black text-white uppercase tracking-widest">Base de Costes</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X className="w-8 h-8" /></button>
        </div>

        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input type="text" placeholder="Filtrar ingredientes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-6 py-4 bg-gray-100 border-none rounded-2xl focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-gray-600" />
            </div>
            <div className="flex gap-2">
              <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".xlsx" />
              <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-2xl transition-all" title="Importar Excel"><FileUp className="w-6 h-6" /></button>
              <button onClick={handleExport} className="p-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-2xl transition-all" title="Exportar Excel"><FileDown className="w-6 h-6" /></button>
            </div>
          </div>

          {!isAdding ? (
            <button onClick={() => setIsAdding(true)} className="w-full py-6 border-4 border-dashed border-gray-100 rounded-[2rem] flex items-center justify-center gap-3 text-gray-400 hover:border-orange-500 hover:text-orange-600 transition-all mb-8 group">
              <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
              <span className="font-black uppercase tracking-widest">Registrar Nuevo Ingrediente o Bebida</span>
            </button>
          ) : (
            <div className="bg-orange-50 p-6 rounded-[2rem] mb-8 border-2 border-orange-200 animate-in slide-in-from-top-4">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <input type="text" placeholder="Nombre" value={newIngredient.name} onChange={(e) => setNewIngredient({...newIngredient, name: e.target.value.toUpperCase()})} className="bg-white border-2 border-orange-100 px-5 py-3 rounded-2xl outline-none focus:border-orange-500 font-bold" />
                <select value={newIngredient.unit} onChange={(e) => setNewIngredient({...newIngredient, unit: e.target.value as Unit})} className="bg-white border-2 border-orange-100 px-5 py-3 rounded-2xl outline-none font-bold text-xs"><option value="Kg">Kg</option><option value="L">L</option><option value="Ud">Ud</option></select>
                <input type="text" inputMode="decimal" placeholder="Compra" value={newIngredient.price} onChange={(e) => setNewIngredient({...newIngredient, price: e.target.value.replace(',', '.')})} className="bg-white border-2 border-orange-100 px-5 py-3 rounded-2xl outline-none focus:border-orange-500 font-bold font-mono" />
                <input type="text" inputMode="decimal" placeholder="PVP" value={newIngredient.salePrice} onChange={(e) => setNewIngredient({...newIngredient, salePrice: e.target.value.replace(',', '.')})} className="bg-white border-2 border-orange-100 px-5 py-3 rounded-2xl outline-none focus:border-orange-500 font-bold font-mono" />
                <button type="button" onClick={() => setNewIngredient({...newIngredient, showInSales: !newIngredient.showInSales})} className={`flex items-center justify-center gap-2 rounded-2xl border-2 transition-all ${newIngredient.showInSales ? 'bg-orange-600 border-orange-600 text-white' : 'bg-white border-orange-100 text-orange-400'}`}>
                  {newIngredient.showInSales ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  <span className="text-[9px] font-black uppercase">Venta</span>
                </button>
                <div className="flex gap-2">
                  <button onClick={handleAdd} className="flex-1 bg-orange-600 text-white font-black uppercase tracking-widest rounded-2xl">Crear</button>
                  <button onClick={() => setIsAdding(false)} className="p-4 bg-gray-200 text-gray-600 rounded-2xl"><X className="w-5 h-5" /></button>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-[2rem] border-2 border-gray-50 shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-50 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
                  <th className="px-8 py-5">Vis.</th>
                  <th className="px-8 py-5">Producto</th>
                  <th className="px-8 py-5">Unidad</th>
                  <th className="px-8 py-5 text-right">Compra</th>
                  <th className="px-8 py-5 text-right">PVP Venta</th>
                  <th className="px-8 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((item) => (
                  <tr key={item.id} className={`hover:bg-zinc-50/50 transition-all ${deletingId === item.id ? 'item-exit' : ''}`}>
                    <td className="px-8 py-5">
                       <button onClick={() => toggleVisibility(item.id)} className={`p-2 rounded-lg transition-colors ${item.showInSales ? 'text-orange-600 hover:bg-orange-50' : 'text-zinc-300 hover:bg-zinc-50'}`}>
                        {item.showInSales ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-8 py-5">
                      {editingId === item.id ? (
                        <input type="text" value={editValues?.name} onChange={(e) => setEditValues({...editValues!, name: e.target.value.toUpperCase()})} className="w-full bg-white border-2 border-orange-500 px-3 py-1.5 rounded-xl font-bold" />
                      ) : (
                        <div className="flex items-center gap-2">
                           <span className={`font-black uppercase tracking-tight ${item.pricePerUnit === 0 ? 'text-red-600' : 'text-gray-700'}`}>{item.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      {editingId === item.id ? (
                        <select value={editValues?.unit} onChange={(e) => setEditValues({...editValues!, unit: e.target.value as Unit})} className="bg-white border-2 border-orange-500 px-2 py-1.5 rounded-xl font-bold text-xs"><option value="Kg">Kg</option><option value="L">L</option><option value="Ud">Ud</option></select>
                      ) : (
                        <span className="bg-zinc-100 text-zinc-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase">{item.unit}</span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-right font-black font-mono">
                      {editingId === item.id ? (
                         <input type="text" value={editValues?.price} onChange={(e) => setEditValues({...editValues!, price: e.target.value.replace(',', '.')})} className="w-20 bg-white border-2 border-orange-500 px-3 py-1 rounded-xl font-bold text-right" />
                      ) : (
                        <span className={item.pricePerUnit === 0 ? 'text-red-600 font-bold' : 'text-gray-600'}>{item.pricePerUnit.toFixed(settings.decimals)}</span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-right font-black font-mono">
                      {editingId === item.id ? (
                         <input type="text" value={editValues?.salePrice} onChange={(e) => setEditValues({...editValues!, salePrice: e.target.value.replace(',', '.')})} className="w-20 bg-white border-2 border-orange-500 px-3 py-1 rounded-xl font-bold text-right" />
                      ) : (
                        <span className="text-orange-600">{item.defaultSalePrice ? item.defaultSalePrice.toFixed(2) : '---'}</span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-right flex justify-end gap-2">
                      {editingId === item.id ? (
                        <button onClick={() => {
                          setIngredients(prev => prev.map(i => i.id === editingId ? { ...i, name: editValues!.name.toUpperCase(), unit: editValues!.unit, pricePerUnit: parseFloat(editValues!.price) || 0, defaultSalePrice: parseFloat(editValues!.salePrice) || 0 } : i));
                          setEditingId(null);
                        }} className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><Check className="w-5 h-5" /></button>
                      ) : (
                        <button onClick={() => { setEditingId(item.id); setEditValues({ name: item.name.toUpperCase(), unit: item.unit, price: String(item.pricePerUnit), salePrice: String(item.defaultSalePrice || ''), showInSales: item.showInSales || false }); }} className="p-2 text-gray-300 hover:text-orange-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                      )}
                      <button onClick={() => setConfirmDelete({id: item.id, name: item.name})} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {confirmDelete && (
          <div className="absolute inset-0 z-[150] bg-zinc-900/95 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-red-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-900/50"><Trash2 className="w-8 h-8" /></div>
              <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-2">¿Confirmar Borrado?</h3>
              <p className="text-gray-400 mb-8 max-w-xs">Borrarás <b>{confirmDelete.name.toUpperCase()}</b> de la base de datos.</p>
              <div className="flex gap-4">
                <button onClick={() => setConfirmDelete(null)} className="px-8 py-4 bg-white/10 text-white font-black rounded-2xl uppercase tracking-widest text-xs">Atrás</button>
                <button onClick={executeDelete} className="px-12 py-4 bg-red-600 text-white font-black rounded-2xl uppercase tracking-widest text-xs">Sí, Borrar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CostsModal;
