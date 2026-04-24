import { useState, useMemo, useEffect } from 'react';
import { Search, Copy, Check, BookOpen, X, Sparkles, Star, ExternalLink, Library, AlertCircle } from 'lucide-react';

const RESOURCE_TYPE_LABELS = { library: 'Library', reddit: 'Reddit', reference: 'Reference', skip: 'Skip' };

// Swiss Modern palette — restrained, disciplined, confident
const C = {
  bg: '#FAFAF9',           // off-white paper
  bgPanel: '#FFFFFF',      // pure white for cards
  bgMuted: '#F5F5F4',      // subtle differentiation
  ink: '#0A0A0A',          // near-black, not pure
  inkDim: '#404040',       // body text
  inkMuted: '#737373',     // secondary
  inkFaint: '#A3A3A3',     // tertiary
  border: '#0A0A0A',       // black borders are part of the grid
  borderSoft: '#E5E5E5',   // subtle dividers
  accent: '#B91C1C',       // oxblood — deliberate, serious
  accentLight: '#FEE2E2',
};

const FAVORITES_KEY = 'prompt-library-favorites-v1';

// Category number formatter: gives "01", "02", etc. based on position
function getCategoryNumber(categoryId, categories) {
  const idx = categories.findIndex(c => c.id === categoryId);
  return idx >= 0 ? String(idx + 1).padStart(2, '0') : '--';
}

function PromptCard({ prompt, onOpen, isFavorite, onToggleFavorite, categoryNumber, categoryLabel }) {
  return (
    <div className="group relative transition-all duration-150"
      style={{ background: C.bgPanel, border: `1px solid ${C.borderSoft}`, borderLeft: `4px solid ${C.ink}` }}
      onMouseEnter={(e) => { e.currentTarget.style.borderLeftColor = C.accent; e.currentTarget.style.borderColor = C.borderSoft; e.currentTarget.style.borderLeftWidth = '4px'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderLeftColor = C.ink; }}
    >
      <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(prompt.id); }}
        className="absolute top-4 right-4 z-10 p-1 transition-colors"
        style={{ color: isFavorite ? C.accent : C.inkFaint }}
        aria-label={isFavorite ? 'Unfavorite' : 'Favorite'}>
        <Star size={16} fill={isFavorite ? 'currentColor' : 'none'} />
      </button>
      <button onClick={() => onOpen(prompt)} className="w-full text-left p-6 pr-12">
        {prompt.category && (
          <p className="font-sans text-[10px] uppercase tracking-[0.2em] mb-3" style={{ color: C.ink, fontWeight: 600 }}>
            {categoryNumber} / {categoryLabel}
          </p>
        )}
        <h3 className="font-sans leading-[1.15] mb-3" style={{ color: C.ink, fontSize: '1.375rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{prompt.name}</h3>
        <p className="font-sans text-sm leading-relaxed mb-4" style={{ color: C.inkDim }}>{prompt.useCase}</p>
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {(prompt.tags || []).slice(0, 4).map(tag => (
              <span key={tag} className="font-mono text-[10px] uppercase tracking-wider" style={{ color: C.inkMuted }}>{tag}</span>
            ))}
          </div>
          <span className="font-sans text-[10px] uppercase tracking-[0.15em] transition-colors" style={{ color: C.inkFaint, fontWeight: 600 }}>Open →</span>
        </div>
      </button>
    </div>
  );
}

function ResourceCard({ resource, index }) {
  const isSkip = resource.type === 'skip';
  const number = String(index + 1).padStart(2, '0');
  return (
    <a href={resource.url} target="_blank" rel="noopener noreferrer"
       className="group relative block p-6 transition-all duration-150"
       style={{ background: C.bgPanel, border: `1px solid ${C.borderSoft}`, borderLeft: `4px solid ${isSkip ? C.inkFaint : C.ink}`, opacity: isSkip ? 0.55 : 1 }}
       onMouseEnter={(e) => { if (!isSkip) e.currentTarget.style.borderLeftColor = C.accent; e.currentTarget.style.opacity = 1; }}
       onMouseLeave={(e) => { if (!isSkip) e.currentTarget.style.borderLeftColor = C.ink; e.currentTarget.style.opacity = isSkip ? 0.55 : 1; }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="font-sans text-[10px] uppercase tracking-[0.2em]" style={{ color: C.ink, fontWeight: 600 }}>
          {number} / {RESOURCE_TYPE_LABELS[resource.type] || resource.type}
        </p>
        <ExternalLink size={14} style={{ color: C.inkFaint }} />
      </div>
      <h3 className="font-sans leading-[1.15] mb-2" style={{ color: C.ink, fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{resource.name}</h3>
      {resource.description && <p className="font-sans text-sm leading-relaxed mb-3" style={{ color: C.inkDim }}>{resource.description}</p>}
      {resource.notes && <p className="font-sans text-sm italic pl-3 mb-3" style={{ color: C.inkMuted, borderLeft: `2px solid ${C.borderSoft}` }}>{resource.notes}</p>}
      <p className="font-mono text-[10px] mt-3 truncate" style={{ color: C.inkFaint }}>{resource.url.replace(/^https?:\/\//, '')}</p>
    </a>
  );
}

function ParameterInput({ param, value, onChange }) {
  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    background: C.bgPanel,
    border: `1px solid ${C.ink}`,
    color: C.ink,
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '14px',
    outline: 'none',
    borderRadius: 0,
  };
  const label = (
    <label className="block mb-2" style={{ fontSize: '11px' }}>
      <span className="font-mono uppercase tracking-wider" style={{ color: C.ink, fontWeight: 600 }}>[{param.key}]</span>
      {param.hint && <span className="font-sans ml-3" style={{ color: C.inkMuted }}>{param.hint}</span>}
    </label>
  );
  if (param.type === 'textarea') return (
    <div>{label}<textarea value={value || ''} onChange={(e) => onChange(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} onFocus={(e) => e.target.style.borderColor = C.accent} onBlur={(e) => e.target.style.borderColor = C.ink} /></div>
  );
  if (param.type === 'dropdown') return (
    <div>{label}
      <select value={value || ''} onChange={(e) => onChange(e.target.value)} style={inputStyle} onFocus={(e) => e.target.style.borderColor = C.accent} onBlur={(e) => e.target.style.borderColor = C.ink}>
        <option value="">Select...</option>
        {(param.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
  if (param.type === 'checkbox') return (
    <div><label className="flex items-center gap-3 cursor-pointer">
      <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} style={{ width: 18, height: 18, accentColor: C.accent }} />
      <span style={{ fontSize: '13px' }}>
        <span className="font-mono uppercase tracking-wider" style={{ color: C.ink, fontWeight: 600 }}>[{param.key}]</span>
        {param.label && <span className="font-sans ml-2" style={{ color: C.inkDim }}>{param.label}</span>}
      </span>
    </label></div>
  );
  return (
    <div>{label}<input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} style={inputStyle} onFocus={(e) => e.target.style.borderColor = C.accent} onBlur={(e) => e.target.style.borderColor = C.ink} /></div>
  );
}

function fillTemplate(template, parameters, values) {
  let result = template;
  (parameters || []).forEach(p => {
    let replacement;
    if (p.type === 'checkbox') replacement = values[p.key] ? (p.ifTrue ?? '') : (p.ifFalse ?? '');
    else { const v = values[p.key]; replacement = (v === undefined || v === '') ? `[${p.key}]` : v; }
    result = result.replaceAll(`[${p.key}]`, replacement);
  });
  return result;
}

function PromptDetail({ prompt, onClose, isFavorite, onToggleFavorite, categoryNumber, categoryLabel }) {
  const [paramValues, setParamValues] = useState(() => {
    const init = {};
    (prompt.parameters || []).forEach(p => { init[p.key] = p.type === 'checkbox' ? false : ''; });
    return init;
  });
  const [copied, setCopied] = useState(false);
  const filledPrompt = useMemo(() => fillTemplate(prompt.template, prompt.parameters, paramValues), [prompt, paramValues]);
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(filledPrompt); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch (err) { console.error(err); }
  };
  const hasParams = prompt.parameters && prompt.parameters.length > 0;

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8" style={{ background: 'rgba(10,10,10,0.55)' }} onClick={onClose}>
      <div
        className="w-full max-w-3xl relative flex flex-col"
        style={{
          background: C.bgPanel,
          border: `2px solid ${C.ink}`,
          maxHeight: 'calc(100vh - 2rem)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 z-20 p-2 transition-colors" style={{ color: C.ink, background: C.bgPanel, border: `1px solid ${C.ink}` }} onMouseEnter={(e) => { e.currentTarget.style.background = C.ink; e.currentTarget.style.color = C.bgPanel; }} onMouseLeave={(e) => { e.currentTarget.style.background = C.bgPanel; e.currentTarget.style.color = C.ink; }} aria-label="Close">
          <X size={16} />
        </button>

        <div className="overflow-y-auto px-8 py-8 space-y-8" style={{ flex: 1 }}>
          <div className="pr-12">
            {prompt.category && (
              <p className="font-sans text-[10px] uppercase tracking-[0.2em] mb-3" style={{ color: C.ink, fontWeight: 600 }}>
                {categoryNumber} / {categoryLabel}
              </p>
            )}
            <div className="flex items-start gap-3 mb-3">
              <h2 className="font-sans leading-[1.1] flex-1" style={{ color: C.ink, fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.025em' }}>{prompt.name}</h2>
              <button onClick={() => onToggleFavorite(prompt.id)} className="p-1 transition-colors mt-2" style={{ color: isFavorite ? C.accent : C.inkFaint }}>
                <Star size={18} fill={isFavorite ? 'currentColor' : 'none'} />
              </button>
            </div>
            <p className="font-mono text-xs" style={{ color: C.inkMuted }}>Source — {prompt.source}</p>
          </div>

          <div style={{ borderTop: `1px solid ${C.ink}` }} />

          <div>
            <h4 className="font-sans text-[10px] uppercase tracking-[0.2em] mb-3" style={{ color: C.ink, fontWeight: 600 }}>Use Case</h4>
            <p className="font-sans leading-relaxed" style={{ color: C.inkDim, fontSize: '15px' }}>{prompt.useCase}</p>
          </div>

          {hasParams && (
            <div>
              <h4 className="font-sans text-[10px] uppercase tracking-[0.2em] mb-4" style={{ color: C.ink, fontWeight: 600 }}>Parameters</h4>
              <div className="space-y-5">
                {prompt.parameters.map(p => <ParameterInput key={p.key} param={p} value={paramValues[p.key]} onChange={(v) => setParamValues({ ...paramValues, [p.key]: v })} />)}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-sans text-[10px] uppercase tracking-[0.2em]" style={{ color: C.ink, fontWeight: 600 }}>{hasParams ? 'Filled Prompt' : 'Prompt'}</h4>
              <button onClick={handleCopy} className="flex items-center gap-2 font-sans text-xs uppercase tracking-[0.15em] px-4 py-2 transition-all" style={{ background: C.ink, color: C.bgPanel, fontWeight: 600, border: `1px solid ${C.ink}` }} onMouseEnter={(e) => { e.currentTarget.style.background = C.accent; e.currentTarget.style.borderColor = C.accent; }} onMouseLeave={(e) => { e.currentTarget.style.background = C.ink; e.currentTarget.style.borderColor = C.ink; }}>
                {copied ? <Check size={12} /> : <Copy size={12} />}{copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="p-5 font-mono text-xs whitespace-pre-wrap leading-relaxed" style={{ background: C.bgMuted, border: `1px solid ${C.borderSoft}`, color: C.inkDim }}>{filledPrompt}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterButton({ active, onClick, children, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="font-sans text-[11px] uppercase tracking-[0.15em] px-4 py-2 transition-colors"
      style={{
        background: active ? C.ink : C.bgPanel,
        color: active ? C.bgPanel : (disabled ? C.inkFaint : C.ink),
        border: `1px solid ${active ? C.ink : (disabled ? C.borderSoft : C.ink)}`,
        fontWeight: 600,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onMouseEnter={(e) => { if (!active && !disabled) { e.currentTarget.style.background = C.ink; e.currentTarget.style.color = C.bgPanel; } }}
      onMouseLeave={(e) => { if (!active && !disabled) { e.currentTarget.style.background = C.bgPanel; e.currentTarget.style.color = C.ink; } }}>
      {children}
    </button>
  );
}

function PromptsTab({ data, favorites, onToggleFavorite, onOpenPrompt }) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const filtered = useMemo(() => (data.prompts || []).filter(p => {
    if (showFavoritesOnly && !favorites.has(p.id)) return false;
    if (activeCategory !== 'all' && p.category !== activeCategory) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.useCase.toLowerCase().includes(q) || (p.tags || []).some(t => t.toLowerCase().includes(q)) || p.source.toLowerCase().includes(q);
  }), [query, activeCategory, showFavoritesOnly, favorites, data.prompts]);

  const categoryCounts = useMemo(() => {
    const counts = { all: (data.prompts || []).length };
    (data.categories || []).forEach(c => { counts[c.id] = (data.prompts || []).filter(p => p.category === c.id).length; });
    return counts;
  }, [data]);

  const categoryLookup = useMemo(() => {
    const m = {};
    (data.categories || []).forEach((c, i) => { m[c.id] = { number: String(i + 1).padStart(2, '0'), label: c.label }; });
    return m;
  }, [data.categories]);

  return (
    <>
      <section className="sticky z-10" style={{ top: '112px', background: C.bg, borderBottom: `1px solid ${C.ink}` }}>
        <div className="max-w-5xl mx-auto px-6 py-5 space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: C.inkMuted }} />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search prompts by name, tag, or use case"
              className="w-full pl-11 pr-4 py-3 font-sans text-sm transition-colors outline-none"
              style={{ background: C.bgPanel, border: `1px solid ${C.ink}`, color: C.ink, borderRadius: 0 }}
              onFocus={(e) => e.target.style.borderColor = C.accent}
              onBlur={(e) => e.target.style.borderColor = C.ink} />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <FilterButton active={activeCategory === 'all' && !showFavoritesOnly} onClick={() => { setActiveCategory('all'); setShowFavoritesOnly(false); }}>All · {categoryCounts.all}</FilterButton>
            <button onClick={() => { setShowFavoritesOnly(!showFavoritesOnly); setActiveCategory('all'); }}
              className="flex items-center gap-1.5 font-sans text-[11px] uppercase tracking-[0.15em] px-4 py-2 transition-colors"
              style={{
                background: showFavoritesOnly ? C.accent : C.bgPanel,
                color: showFavoritesOnly ? C.bgPanel : C.ink,
                border: `1px solid ${showFavoritesOnly ? C.accent : C.ink}`,
                fontWeight: 600,
              }}>
              <Star size={11} fill={showFavoritesOnly ? 'currentColor' : 'none'} />Favorites · {favorites.size}
            </button>
            <span className="mx-1" style={{ color: C.inkFaint }}>·</span>
            {(data.categories || []).map((cat, i) => (
              <FilterButton key={cat.id} active={activeCategory === cat.id && !showFavoritesOnly} disabled={categoryCounts[cat.id] === 0} onClick={() => { setActiveCategory(cat.id); setShowFavoritesOnly(false); }}>
                {String(i + 1).padStart(2, '0')} · {cat.label} · {categoryCounts[cat.id] || 0}
              </FilterButton>
            ))}
          </div>
        </div>
      </section>
      <main className="max-w-5xl mx-auto px-6 py-10">
        {filtered.length === 0 ? (
          <div className="text-center py-24" style={{ border: `1px solid ${C.ink}` }}>
            <Sparkles size={24} className="mx-auto mb-4" style={{ color: C.inkFaint }} />
            <p className="font-sans mb-1" style={{ color: C.ink, fontWeight: 600 }}>No prompts match your filter.</p>
            <p className="font-sans text-xs uppercase tracking-[0.15em]" style={{ color: C.inkMuted }}>Try a different query, category, or turn off favorites</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-5">
            {filtered.map(prompt => {
              const cat = categoryLookup[prompt.category] || { number: '--', label: 'Misc' };
              return <PromptCard key={prompt.id} prompt={prompt} onOpen={onOpenPrompt} isFavorite={favorites.has(prompt.id)} onToggleFavorite={onToggleFavorite} categoryNumber={cat.number} categoryLabel={cat.label} />;
            })}
          </div>
        )}
      </main>
    </>
  );
}

function ResourcesTab({ data }) {
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState('all');

  const filtered = useMemo(() => (data.resources || []).filter(r => {
    if (activeType !== 'all' && r.type !== activeType) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return r.name.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q) || (r.notes || '').toLowerCase().includes(q);
  }), [query, activeType, data.resources]);

  const typeCounts = useMemo(() => {
    const counts = { all: (data.resources || []).length };
    Object.keys(RESOURCE_TYPE_LABELS).forEach(t => { counts[t] = (data.resources || []).filter(r => r.type === t).length; });
    return counts;
  }, [data]);

  return (
    <>
      <section className="sticky z-10" style={{ top: '112px', background: C.bg, borderBottom: `1px solid ${C.ink}` }}>
        <div className="max-w-5xl mx-auto px-6 py-5 space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: C.inkMuted }} />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search resources by name or description"
              className="w-full pl-11 pr-4 py-3 font-sans text-sm transition-colors outline-none"
              style={{ background: C.bgPanel, border: `1px solid ${C.ink}`, color: C.ink, borderRadius: 0 }}
              onFocus={(e) => e.target.style.borderColor = C.accent}
              onBlur={(e) => e.target.style.borderColor = C.ink} />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <FilterButton active={activeType === 'all'} onClick={() => setActiveType('all')}>All · {typeCounts.all}</FilterButton>
            {Object.entries(RESOURCE_TYPE_LABELS).map(([type, label]) => (
              <FilterButton key={type} active={activeType === type} disabled={typeCounts[type] === 0} onClick={() => setActiveType(type)}>
                {label} · {typeCounts[type] || 0}
              </FilterButton>
            ))}
          </div>
        </div>
      </section>
      <main className="max-w-5xl mx-auto px-6 py-10">
        {filtered.length === 0 ? (
          <div className="text-center py-24" style={{ border: `1px solid ${C.ink}` }}>
            <Sparkles size={24} className="mx-auto mb-4" style={{ color: C.inkFaint }} />
            <p className="font-sans" style={{ color: C.ink, fontWeight: 600 }}>No resources match your filter.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-5">
            {filtered.map((resource, i) => <ResourceCard key={resource.id} resource={resource} index={i} />)}
          </div>
        )}
      </main>
    </>
  );
}

function ErrorBanner({ message }) {
  return (
    <div className="px-6 py-3" style={{ background: C.accentLight, borderBottom: `1px solid ${C.accent}` }}>
      <div className="max-w-5xl mx-auto flex items-center gap-2 text-sm font-mono" style={{ color: C.accent }}>
        <AlertCircle size={16} />
        <span>{message}</span>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState('prompts');
  const [openPrompt, setOpenPrompt] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const [promptsData, setPromptsData] = useState({ categories: [], prompts: [] });
  const [resourcesData, setResourcesData] = useState({ resources: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/prompts.json').then(r => { if (!r.ok) throw new Error('Failed to load prompts.json'); return r.json(); }),
      fetch('/resources.json').then(r => { if (!r.ok) throw new Error('Failed to load resources.json'); return r.json(); })
    ])
      .then(([p, r]) => { setPromptsData(p); setResourcesData(r); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  useEffect(() => {
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites])); } catch {}
  }, [favorites]);

  const toggleFavorite = (id) => setFavorites(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const categoryLookup = useMemo(() => {
    const m = {};
    (promptsData.categories || []).forEach((c, i) => { m[c.id] = { number: String(i + 1).padStart(2, '0'), label: c.label }; });
    return m;
  }, [promptsData.categories]);

  const openPromptCat = openPrompt ? (categoryLookup[openPrompt.category] || { number: '--', label: 'Misc' }) : null;

  return (
    <div className="min-h-screen" style={{ background: C.bg, color: C.ink, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
        .font-sans { font-family: 'Inter', system-ui, sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; font-feature-settings: "calt" 1; }
        body { background: ${C.bg}; -webkit-font-smoothing: antialiased; }
        ::selection { background: ${C.accent}; color: ${C.bgPanel}; }
        input::placeholder, textarea::placeholder { color: ${C.inkFaint}; }
        select { appearance: none; background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'><path d='M2 4l4 4 4-4' stroke='%230A0A0A' stroke-width='1.5' fill='none'/></svg>"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px !important; }
      `}</style>

      <header className="sticky top-0 z-20" style={{ background: C.bg, borderBottom: `2px solid ${C.ink}` }}>
        <div className="max-w-5xl mx-auto px-6 pt-8 pb-0">
          <div className="flex items-end justify-between flex-wrap gap-2 mb-6">
            <div>
              <p className="font-sans text-[10px] uppercase tracking-[0.25em] mb-2" style={{ color: C.accent, fontWeight: 700 }}>Personal Reference</p>
              <h1 className="font-sans leading-[0.95]" style={{ color: C.ink, fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.035em' }}>Prompt Library</h1>
            </div>
            <div className="flex items-baseline gap-3 font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: C.inkMuted }}>
              <span>Vol. 01</span><span style={{ color: C.inkFaint }}>/</span><span>{new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
          <div className="flex items-end gap-0">
            <button onClick={() => setTab('prompts')} className="flex items-center gap-2 px-5 py-3 font-sans text-xs uppercase tracking-[0.15em] transition-all"
              style={{ background: tab === 'prompts' ? C.ink : 'transparent', color: tab === 'prompts' ? C.bgPanel : C.ink, fontWeight: 600 }}>
              <BookOpen size={14} />Prompts<span className="ml-1 font-mono" style={{ opacity: 0.6 }}>·{(promptsData.prompts || []).length}</span>
            </button>
            <button onClick={() => setTab('resources')} className="flex items-center gap-2 px-5 py-3 font-sans text-xs uppercase tracking-[0.15em] transition-all"
              style={{ background: tab === 'resources' ? C.ink : 'transparent', color: tab === 'resources' ? C.bgPanel : C.ink, fontWeight: 600 }}>
              <Library size={14} />Resources<span className="ml-1 font-mono" style={{ opacity: 0.6 }}>·{(resourcesData.resources || []).length}</span>
            </button>
          </div>
        </div>
      </header>

      {error && <ErrorBanner message={`Error: ${error}. Check prompts.json and resources.json.`} />}

      {loading ? (
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <p className="font-sans text-xs uppercase tracking-[0.2em]" style={{ color: C.inkMuted, fontWeight: 600 }}>Loading…</p>
        </div>
      ) : tab === 'prompts' ? (
        <PromptsTab data={promptsData} favorites={favorites} onToggleFavorite={toggleFavorite} onOpenPrompt={setOpenPrompt} />
      ) : (
        <ResourcesTab data={resourcesData} />
      )}

      <footer className="mt-20" style={{ borderTop: `1px solid ${C.ink}` }}>
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between flex-wrap gap-2">
          <p className="font-sans text-[10px] uppercase tracking-[0.2em]" style={{ color: C.inkMuted, fontWeight: 600 }}>
            {tab === 'prompts' ? 'Edit prompts.json on GitHub to add entries' : 'Edit resources.json on GitHub to add entries'}
          </p>
          <p className="font-sans text-[10px] uppercase tracking-[0.2em]" style={{ color: C.inkFaint, fontWeight: 600 }}>Favorites saved in your browser</p>
        </div>
      </footer>

      {openPrompt && <PromptDetail prompt={openPrompt} onClose={() => setOpenPrompt(null)} isFavorite={favorites.has(openPrompt.id)} onToggleFavorite={toggleFavorite} categoryNumber={openPromptCat.number} categoryLabel={openPromptCat.label} />}
    </div>
  );
}
