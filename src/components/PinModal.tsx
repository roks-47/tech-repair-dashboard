import React, { useState } from 'react';
import { Lock, Delete, Wrench } from 'lucide-react';

interface PinModalProps {
  correctPin: string;
  isOpen: boolean;
  onSuccess: () => void;
  shopName: string;
}

export const PinModal: React.FC<PinModalProps> = ({
  correctPin,
  isOpen,
  onSuccess,
  shopName,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);

      if (nextPin.length === 4) {
        if (nextPin === correctPin) {
          onSuccess();
          setPin('');
        } else {
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 800);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xs text-center flex flex-col items-center">
        
        {/* App Logo */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-600/30 mb-4">
          <Wrench className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-xl font-bold text-white mb-1">{shopName}</h1>
        <p className="text-xs text-slate-400 mb-6 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-blue-400" /> Digite o PIN de 4 dígitos da bancada
        </p>

        {/* PIN Indicators */}
        <div className={`flex justify-center gap-4 mb-8 ${error ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                pin.length > index
                  ? error
                    ? 'bg-rose-500 border-rose-500 scale-110'
                    : 'bg-blue-500 border-blue-500 scale-110 shadow-lg shadow-blue-500/50'
                  : 'border-slate-700 bg-slate-900'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-rose-400 font-semibold mb-4 -mt-4 animate-bounce">
            PIN Incorreto! Tente novamente.
          </p>
        )}

        {/* Touch Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[260px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-16 rounded-2xl bg-slate-900 border border-slate-800 text-xl font-bold text-slate-100 hover:bg-slate-800 active:bg-blue-600 active:scale-95 transition-all shadow-md flex items-center justify-center"
            >
              {digit}
            </button>
          ))}

          <div />

          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-16 rounded-2xl bg-slate-900 border border-slate-800 text-xl font-bold text-slate-100 hover:bg-slate-800 active:bg-blue-600 active:scale-95 transition-all shadow-md flex items-center justify-center"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="h-16 rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center"
            title="Apagar dígito"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        <p className="text-[11px] text-slate-500 mt-8">
          PIN padrão inicial: <span className="font-mono text-slate-400">1234</span>
        </p>

      </div>
    </div>
  );
};
