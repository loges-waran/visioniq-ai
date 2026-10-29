import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { History, Trash2, Clock, CheckCircle2, AlertTriangle, HelpCircle, RefreshCw } from 'lucide-react';

export function HistoryPage({ enableHistory = true }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getHistory(50, 0);
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('History fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (enableHistory) {
      fetchHistory();
    } else {
      setLoading(false);
    }
  }, [enableHistory]);

  const handleClear = async () => {
    if (!window.confirm('Are you sure you want to delete all question history?')) return;
    try {
      await api.clearHistory();
      setItems([]);
      setTotal(0);
      setSelectedItem(null);
    } catch (err) {
      alert('Failed to clear history: ' + err.message);
    }
  };

  if (!enableHistory) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto mb-4 text-slate-400">
          <History className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">Question History is Disabled</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
          You have chosen not to persist question history. To enable storing past questions and answers locally, toggle history in the Settings tab.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            Question History
          </h1>
          <p className="text-xs text-slate-400">
            Review past questions detected and solved during your study sessions ({total} saved)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          {items.length > 0 && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium rounded-xl border border-rose-500/30 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear History
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">
          Loading history records...
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-sm bg-navy-850 border border-slate-800 rounded-2xl p-8">
          No questions saved yet. Start the camera and scan questions to view them here.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="bg-navy-850 hover:bg-navy-800 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition cursor-pointer flex flex-col justify-between gap-3 shadow-md"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="font-mono text-indigo-400">{item.id.substring(0, 10)}</span>
                  <span className="flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-200 line-clamp-2 mb-2">
                  {item.question}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {item.selected_option ? `Option ${item.selected_option}: ` : ''}{item.answer}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                  {item.confidence_label}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-navy-850 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-mono text-xs text-indigo-400">{selectedItem.id}</span>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>

            <div>
              <p className="text-xs uppercase font-semibold text-slate-400 mb-1">Question</p>
              <p className="text-sm font-medium text-white">{selectedItem.question}</p>
            </div>

            {selectedItem.options && selectedItem.options.length > 0 && (
              <div>
                <p className="text-xs uppercase font-semibold text-slate-400 mb-1">Options</p>
                <div className="space-y-1">
                  {selectedItem.options.map((o, idx) => (
                    <div key={idx} className="text-xs text-slate-300 bg-navy-900 p-2 rounded-lg border border-slate-800">
                      {o}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3 text-xs text-emerald-200">
              <span className="font-bold">Answer: </span>
              {selectedItem.selected_option && `[Option ${selectedItem.selected_option}] `}
              {selectedItem.answer}
            </div>

            {selectedItem.explanation && (
              <div>
                <p className="text-xs uppercase font-semibold text-slate-400 mb-1">Explanation</p>
                <p className="text-xs text-slate-300 leading-relaxed bg-navy-900 p-3 rounded-xl border border-slate-800">
                  {selectedItem.explanation}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
