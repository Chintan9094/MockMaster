import { useEffect, useRef } from 'react';
import { Keyboard, AlertTriangle } from 'lucide-react';

function Kbd({ children }) {
  return (
    <kbd className="inline-flex min-w-[1.25rem] items-center justify-center px-1.5 py-0.5 text-[10px] font-mono font-semibold text-gray-600 bg-gray-100 border border-gray-200 rounded">
      {children}
    </kbd>
  );
}

function getQuestionStatus(idx, currentIndex, answers) {
  const a = answers[idx];
  if (idx === currentIndex) return 'current';
  if (!a) return 'unvisited';
  if (a.markedForReview && a.selectedAnswer) return 'marked-answered';
  if (a.markedForReview) return 'marked';
  if (a.selectedAnswer) return 'answered';
  return 'unvisited';
}

export default function QuestionPalette({
  total,
  answers,
  currentIndex,
  onSelect,
  statusStyles,
  answeredCount,
  markedCount,
  tabSwitchCount,
  onShowShortcuts,
  className = ''
}) {
  const scrollRef = useRef(null);
  const currentBtnRef = useRef(null);

  useEffect(() => {
    const container = scrollRef.current;
    const btn = currentBtnRef.current;
    if (!container || !btn) return;

    const containerRect = container.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const padding = 8;

    if (btnRect.top < containerRect.top + padding) {
      container.scrollTop += btnRect.top - containerRect.top - padding;
    } else if (btnRect.bottom > containerRect.bottom - padding) {
      container.scrollTop += btnRect.bottom - containerRect.bottom + padding;
    }
  }, [currentIndex]);

  const gridCols =
    total > 200 ? 'grid-cols-8' :
    total > 100 ? 'grid-cols-6' :
    'grid-cols-5';

  const cellSize = total > 80 ? 'h-8 text-[10px]' : 'aspect-square text-[12px]';

  return (
    <div className={`flex flex-col min-h-0 ${className}`}>
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto py-1 scroll-smooth">
        <div className={`grid ${gridCols} gap-1.5`}>
          {Array.from({ length: total }, (_, idx) => (
            <button
              key={idx}
              ref={idx === currentIndex ? currentBtnRef : undefined}
              type="button"
              onClick={() => onSelect(idx)}
              title={`Question ${idx + 1}`}
              className={`w-full rounded-md font-medium transition-all ${cellSize} ${statusStyles[getQuestionStatus(idx, currentIndex, answers)]}`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="shrink-0 pt-3 mt-2 border-t border-gray-100 space-y-2 text-[11px]">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-gray-600">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500" /> {answeredCount} done</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400" /> {markedCount} marked</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border border-indigo-600 bg-white" /> current</span>
        </div>
        {tabSwitchCount > 0 && (
          <p className="text-red-600 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> {tabSwitchCount} tab switch{tabSwitchCount > 1 ? 'es' : ''}
          </p>
        )}
        {onShowShortcuts && (
          <button
            type="button"
            onClick={onShowShortcuts}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-indigo-50 text-indigo-600 font-medium hover:bg-indigo-100"
          >
            <Keyboard className="w-3.5 h-3.5" /> Shortcuts <Kbd>?</Kbd>
          </button>
        )}
      </div>
    </div>
  );
}
