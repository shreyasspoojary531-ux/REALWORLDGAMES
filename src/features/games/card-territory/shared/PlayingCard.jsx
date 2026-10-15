import { SUIT_COLORS } from './deck';

export const PlayingCard = ({
  card,
  hidden = false,
  selected = false,
  onClick,
  className = '',
}) => {
  if (hidden || !card) {
    return (
      <div
        className={`w-14 h-20 sm:w-16 sm:h-24 rounded-xl bg-gradient-to-tr from-blue-900 to-indigo-800 border-2 border-blue-400/30 flex items-center justify-center shadow-md select-none ${className}`}
      >
        <div className="w-8 h-12 rounded-lg border border-dashed border-blue-400/40 flex items-center justify-center text-xs text-blue-200">
          ♠
        </div>
      </div>
    );
  }

  const suitColor = SUIT_COLORS[card.suit] || 'text-slate-100';

  return (
    <div
      onClick={onClick}
      className={`w-14 h-20 sm:w-16 sm:h-24 rounded-xl bg-slate-900 border-2 transition-all cursor-pointer flex flex-col justify-between p-1.5 shadow-md select-none ${
        selected
          ? 'border-amber-400 -translate-y-2 shadow-amber-500/20 shadow-lg bg-slate-850'
          : 'border-slate-700/80 hover:border-slate-500 hover:-translate-y-1'
      } ${className}`}
    >
      <div
        className={`text-xs font-black leading-none flex items-center justify-between ${suitColor}`}
      >
        <span>{card.rank}</span>
        <span className="text-[10px]">{card.suit}</span>
      </div>

      <div className={`text-xl sm:text-2xl text-center leading-none ${suitColor}`}>{card.suit}</div>

      <div
        className={`text-xs font-black leading-none flex items-center justify-between rotate-180 ${suitColor}`}
      >
        <span>{card.rank}</span>
        <span className="text-[10px]">{card.suit}</span>
      </div>
    </div>
  );
};
