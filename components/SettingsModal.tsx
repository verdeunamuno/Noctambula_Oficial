
import React, { useState, useEffect } from 'react';
import { X, Settings as SettingsIcon, Save, MonitorDown, CheckCircle2, Info, Percent } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, setSettings }) => {
  const [canInstall, setCanInstall] = useState(!!(window as any).deferredPrompt);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleInstallAvailable = () => setCanInstall(true);
    window.addEventListener('pwa-install-available', handleInstallAvailable);
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
    return () => window.removeEventListener('pwa-install-available', handleInstallAvailable);
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = (window as any).deferredPrompt;
    if (!promptEvent) return;
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === 'accepted') {
      (window as any).deferredPrompt = null;
      setCanInstall(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
        <div className="px-6 py-4 bg-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SettingsIcon className="text-orange-500 w-5 h-5" />
            <h2 className="text-lg font-bold text-white uppercase">Configuración</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
          <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 mb-2">
            <label className="block text-[10px] font-black text-orange-600 uppercase mb-3 tracking-widest">App de Escritorio</label>
            {isInstalled ? (
              <div className="flex items-center gap-3 text-green-600 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>¡Ya tienes la app instalada!</span>
              </div>
            ) : canInstall ? (
              <button onClick={handleInstallClick} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-900/20 active:scale-95 text-xs uppercase tracking-widest">
                <MonitorDown className="w-4 h-4" /> Instalar en Windows 11
              </button>
            ) : (
              <div className="flex items-start gap-3 bg-white p-4 rounded-xl border border-orange-200 shadow-sm">
                <Info className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <div className="text-[10px] text-gray-600 font-medium leading-relaxed">
                  <p className="font-black text-orange-600 uppercase mb-1">Para instalarla en Windows:</p>
                  <ol className="list-decimal ml-3 space-y-1">
                    <li>Abre esta web en una pestaña normal de Chrome/Edge.</li>
                    <li>Busca el icono de "Instalar" en la barra de direcciones.</li>
                  </ol>
                </div>
              </div>
            )}
          </div>

          <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
             <label className="block text-[10px] font-black text-zinc-500 uppercase mb-3 tracking-widest flex items-center gap-2">
               <Percent className="w-3 h-3" /> Comisión Glovo (%)
             </label>
             <input 
              type="text" 
              inputMode="decimal"
              value={settings.glovoCommission}
              onChange={(e) => setSettings({ ...settings, glovoCommission: parseFloat(e.target.value.replace(',', '.')) || 0 })}
              className="w-full bg-white border-2 border-zinc-200 focus:border-orange-500 rounded-xl px-4 py-3 font-black text-xl outline-none transition-all"
            />
            <p className="text-[9px] text-zinc-400 mt-2 font-medium">Se aplicará sobre el PVP total antes de calcular la rentabilidad neta.</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-500 uppercase mb-3">Número de Decimales</label>
            <div className="flex items-center gap-4">
              {[1, 2, 3, 4].map((n) => (
                <button key={n} onClick={() => setSettings({ ...settings, decimals: n })} className={`flex-1 py-3 rounded-xl font-bold transition-all ${settings.decimals === n ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20 scale-105' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>{n}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-500 uppercase mb-3">Símbolo de Moneda</label>
            <input type="text" value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} className="w-full bg-gray-100 border-transparent focus:bg-white focus:ring-2 focus:ring-orange-500 rounded-xl px-4 py-3 font-bold text-xl outline-none" />
          </div>
        </div>

        <div className="px-8 py-6 bg-gray-50 border-t flex flex-col gap-2">
           <button onClick={onClose} className="w-full bg-zinc-800 hover:bg-zinc-900 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95">
            <Save className="w-5 h-5" /> <span>Guardar Preferencias</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Fix: Added missing default export
export default SettingsModal;
