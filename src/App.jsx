import { useState, useMemo, useEffect } from 'react';
import { Search, Copy, Check, BookOpen, X, Sparkles, Star, ExternalLink, Library, AlertCircle } from 'lucide-react';

const RESOURCE_TYPE_LABELS = { library: 'Library', reddit: 'Reddit', reference: 'Reference', skip: 'Skip' };

// Terminal color palette
const C = {
  bg: '#0D1117',
  bgPanel: '#161B22',
  bgElevated: '#21262D',
  border: '#30363D',
  borderHover: '#58606B',
  text: '#F0F6FC',
  textDim: '#C9D1D9',
  textMuted: '#8B949E',
  amber: '#F5A524',
  green: '#3FB950',
  blue: '#58A6FF',
  red: '#F85149',
  violet: '#A78BFA',
};

const RESOURCE_TYPE_COLORS = {
  library: C.blue,
  reddit: C.amber,
  reference: C.violet,
  skip: C.textMuted,
};

const FAVORITES_KEY = 'prompt-library-favorites-v1';

function PromptCard({ prompt, onOpen, isFavorite, onToggleFavorite }) {
  return (
    <div className="group relative transition-all duration-200" style={{ background: C.bgPanel, border: `1px solid ${C.border}` }} onMouseEnter={(e) => e.currentTarget.style.borderColor = C.amber} onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}>
      <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(prompt.id); }}
        className="absolute top-3 right-3 z-10 p-1 transition-colors"
        style={{ color: isFavorite ? C.amber : C.textMuted }}
        aria-label={isFavorite ? 'Unfavorite' : 'Favorite'}>
        <Star size={16} fill={isFavorite ? 'currentColor' : 'none'} />
      </button>
      <button onClick={() => onOpen(prompt)} className="w-full text-left p-5 pr-10">
        {prompt.category && (
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] mb-2" style={{ color: C.amber }}>
            &gt; {prompt.category}
          </p>
        )}
        <h3 className="font-mono text-base leading-tight mb-2" style={{ color: C.text, fontWeight: 500 }}>{prompt.name}</h3>
        <p className="text-sm leading-relaxed mb-4" style={{ color: C.textMuted, fontFamily: 'system-ui, sans-serif' }}>{prompt.useCase}</p>
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            {(prompt.tags || []).slice(0, 4).map(tag => (
              <span key={tag} className="font-mono text-[10px]" style={{ color: C.green }}>#{tag}</span>
            ))}
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider transition-colors" style={{ color: C.textMuted }}>Open →</span>
        </div>
      </button>
    </div>
  );
}

function ResourceCard({ resource }) {
  const accent = RESOURCE_TYPE_COLORS[resource.type] || C.blue;
  const isSkip = resource.type === 'skip';
  return (
    <a href={resource.url} target="_blank" rel="noopener noreferrer"
       className="group relative block p-5 transition-all duration-200"
       style={{ background: C.bgPanel, border: `1px solid ${C.border}`, opacity: isSkip ? 0.5 : 1 }}
       onMouseEnter={(e) => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.opacity = 1; }}
       onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.opacity = isSkip ? 0.5 : 1; }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: accent }}>
          &gt; {RESOURCE_TYPE_LABELS[resource.type] || resource.type}
        </span>
        <ExternalLink size={14} style={{ color: C.textMuted }} />
      </div>
      <h3 className="font-mono text-base leading-tight mb-2" style={{ color: C.text, fontWeight: 500 }}>{resource.name}</h3>
      {resource.description && <p className="text-sm leading-relaxed mb-3" style={{ color: C.textMuted, fontFamily: 'system-ui, sans-serif' }}>{resource.description}</p>}
      {resource.notes && <p className="text-xs italic pl-3 mb-3" style={{ color: C.textMuted, borderLeft: `2px solid ${C.border}`, fontFamily: 'system-ui, sans-serif' }}>{resource.notes}</p>}
      <p className="font-mono text-[10px] mt-3 truncate" style={{ color: C.textMuted }}>{resource.url.replace(/^https?:\/\//, '')}</p>
    </a>
  );
}

function ParameterInput({ param, value, onChange }) {
  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    background: C.bg,
    border: `1px solid ${C.border}`,
    color: C.text,
    fontFamily: 'ui-monospace, monospace',
    fontSize: '14px',
    outline: 'none',
  };
  const label = (
    <label className="block font-mono text-xs mb-2" style={{ color: C.textDim }}>
      <span style={{ color: C.amber }}>[{param.key}]</span>
      {param.hint && <span className="ml-2 normal-case" style={{ color: C.textMuted }}>— {param.hint}</span>}
    </label>
  );
  if (param.type === 'textarea') return (
    <div>{label}<textarea value={value || ''} onChange={(e) => onChange(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} onFocus={(e) => e.target.style.borderColor = C.amber} onBlur={(e) => e.target.style.borderColor = C.border} /></div>
  );
  if (param.type === 'dropdown') return (
    <div>{label}
      <select value={value || ''} onChange={(e) => onChange(e.target.value)} style={inputStyle} onFocus={(e) => e.target.style.borderColor = C.amber} onBlur={(e) => e.target.style.borderColor = C.border}>
        <option value="">Select...</option>
        {(param.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
  if (param.type === 'checkbox') return (
    <div><label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} style={{ width: 16, height: 16, accentColor: C.amber }} />
      <span className="font-mono text-sm" style={{ color: C.textDim }}><span style={{ color: C.amber }}>[{param.key}]</span>{param.label && <span className="ml-2 normal-case" style={{ color: C.textMuted, fontFamily: 'system-ui, sans-serif' }}>— {param.label}</span>}</span>
    </label></div>
  );
  return (
    <div>{label}<input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} style={inputStyle} onFocus={(e) => e.target.style.borderColor = C.amber} onBlur={(e) => e.target.style.borderColor = C.border} /></div>
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

function PromptDetail({ prompt, onClose, isFavorite, onToggleFavorite }) {
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
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-6 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="w-full max-w-3xl my-0 sm:my-8 relative" style={{ background: C.bgPanel, border: `1px solid ${C.amber}` }}>
        <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 transition-colors" style={{ color: C.textMuted, background: C.bg, border: `1px solid ${C.border}` }} onMouseEnter={(e) => e.currentTarget.style.color = C.text} onMouseLeave={(e) => e.currentTarget.style.color = C.textMuted} aria-label="Close">
          <X size={16} />
        </button>

        <div className="px-6 py-8 space-y-6">
          <div className="pr-12">
            {prompt.category && (
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] mb-2" style={{ color: C.amber }}>
                &gt; {prompt.category}
              </p>
            )}
            <div className="flex items-start gap-3 mb-2">
              <h2 className="font-mono text-2xl leading-tight flex-1" style={{ color: C.text, fontWeight: 500 }}>{prompt.name}</h2>
              <button onClick={() => onToggleFavorite(prompt.id)} className="p-1 transition-colors mt-1" style={{ color: isFavorite ? C.amber : C.textMuted }}>
                <Star size={16} fill={isFavorite ? 'currentColor' : 'none'} />
              </button>
            </div>
            <p className="font-mono text-xs" style={{ color: C.textMuted }}>source: {prompt.source}</p>
          </div>

          <div style={{ borderTop: `1px solid ${C.border}` }} />

          <div>
            <h4 className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: C.textMuted }}>// Use case</h4>
            <p className="leading-relaxed" style={{ color: C.textDim, fontFamily: 'system-ui, sans-serif' }}>{prompt.useCase}</p>
          </div>

          {hasParams && (
            <div>
              <h4 className="font-mono text-[10px] uppercase tracking-widest mb-3" style={{ color: C.textMuted }}>// Fill in parameters</h4>
              <div className="space-y-4">
                {prompt.parameters.map(p => <ParameterInput key={p.key} param={p} value={paramValues[p.key]} onChange={(v) => setParamValues({ ...paramValues, [p.key]: v })} />)}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-mono text-[10px] uppercase tracking-widest" style={{ color: C.textMuted }}>// {hasParams ? 'Filled prompt' : 'Prompt'}</h4>
              <button onClick={handleCopy} className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider px-3 py-1.5 transition-all" style={{ background: C.amber, color: C.bg, fontWeight: 500 }} onMouseEnter={(e) => e.currentTarget.style.background = '#FFB84D'} onMouseLeave={(e) => e.currentTarget.style.background = C.amber}>
                {copied ? <Check size={12} /> : <Copy size={12} />}{copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="p-4 font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto" style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.textDim }}>{filledPrompt}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterButton({ active, onClick, children, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="font-mono text-[10px] uppercase tracking-wider px-3 py-1.5 transition-colors"
      style={{
        background: active ? C.amber : 'transparent',
        color: active ? C.bg : (disabled ? C.textMuted : C.textDim),
        border: `1px solid ${active ? C.amber : C.border}`,
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onMouseEnter={(e) => { if (!active && !disabled) e.currentTarget.style.borderColor = C.amber; }}
      onMouseLeave={(e) => { if (!active && !disabled) e.currentTarget.style.borderColor = C.border; }}>
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

  return (
    <>
      <section className="sticky z-10" style={{ top: '129px', background: C.bg, borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-5xl mx-auto px-6 py-4 space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textMuted }} />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="// Search prompts by name, tag, or use case..."
              className="w-full pl-10 pr-4 py-2.5 font-mono text-sm transition-colors outline-none"
              style={{ background: C.bgPanel, border: `1px solid ${C.border}`, color: C.text }}
              onFocus={(e) => e.target.style.borderColor = C.amber}
              onBlur={(e) => e.target.style.borderColor = C.border} />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <FilterButton active={activeCategory === 'all' && !showFavoritesOnly} onClick={() => { setActiveCategory('all'); setShowFavoritesOnly(false); }}>All · {categoryCounts.all}</FilterButton>
            <button onClick={() => { setShowFavoritesOnly(!showFavoritesOnly); setActiveCategory('all'); }}
              className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider px-3 py-1.5 transition-colors"
              style={{
                background: showFavoritesOnly ? C.amber : 'transparent',
                color: showFavoritesOnly ? C.bg : C.textDim,
                border: `1px solid ${showFavoritesOnly ? C.amber : C.border}`,
              }}>
              <Star size={10} fill={showFavoritesOnly ? 'currentColor' : 'none'} />Favorites · {favorites.size}
            </button>
            <span style={{ color: C.border }} className="mx-1">·</span>
            {(data.categories || []).map(cat => (
              <FilterButton key={cat.id} active={activeCategory === cat.id && !showFavoritesOnly} disabled={categoryCounts[cat.id] === 0} onClick={() => { setActiveCategory(cat.id); setShowFavoritesOnly(false); }}>
                {cat.label} · {categoryCounts[cat.id] || 0}
              </FilterButton>
            ))}
          </div>
        </div>
      </section>
      <main className="max-w-5xl mx-auto px-6 py-8">
        {filtered.length === 0 ? (
          <div className="text-center py-20" style={{ border: `1px dashed ${C.border}` }}>
            <Sparkles size={24} className="mx-auto mb-3" style={{ color: C.textMuted }} />
            <p className="mb-1" style={{ color: C.textDim, fontFamily: 'system-ui, sans-serif' }}>No prompts match your filter.</p>
            <p className="font-mono text-xs uppercase tracking-wider" style={{ color: C.textMuted }}>Try a different query, category, or turn off favorites</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {filtered.map(prompt => <PromptCard key={prompt.id} prompt={prompt} onOpen={onOpenPrompt} isFavorite={favorites.has(prompt.id)} onToggleFavorite={onToggleFavorite} />)}
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
      <section className="sticky z-10" style={{ top: '129px', background: C.bg, borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-5xl mx-auto px-6 py-4 space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textMuted }} />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="// Search resources by name or description..."
              className="w-full pl-10 pr-4 py-2.5 font-mono text-sm transition-colors outline-none"
              style={{ background: C.bgPanel, border: `1px solid ${C.border}`, color: C.text }}
              onFocus={(e) => e.target.style.borderColor = C.amber}
              onBlur={(e) => e.target.style.borderColor = C.border} />
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
      <main className="max-w-5xl mx-auto px-6 py-8">
        {filtered.length === 0 ? (
          <div className="text-center py-20" style={{ border: `1px dashed ${C.border}` }}>
            <Sparkles size={24} className="mx-auto mb-3" style={{ color: C.textMuted }} />
            <p style={{ color: C.textDim, fontFamily: 'system-ui, sans-serif' }}>No resources match your filter.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {filtered.map(resource => <ResourceCard key={resource.id} resource={resource} />)}
          </div>
        )}
      </main>
    </>
  );
}

function ErrorBanner({ message }) {
  return (
    <div className="px-6 py-3" style={{ background: `${C.red}22`, borderBottom: `1px solid ${C.red}` }}>
      <div className="max-w-5xl mx-auto flex items-center gap-2 text-sm font-mono" style={{ color: C.red }}>
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

  return (
    <div className="min-h-screen" style={{ background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');
        .font-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
        body { background: ${C.bg}; }
        ::selection { background: ${C.amber}; color: ${C.bg}; }
        input::placeholder, textarea::placeholder { color: ${C.textMuted}; }
        select option { background: ${C.bgPanel}; color: ${C.text}; }
      `}</style>

      <header className="sticky top-0 z-20" style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-5xl mx-auto px-6 pt-6 pb-0">
          <div className="flex items-baseline justify-between flex-wrap gap-2 mb-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: C.amber }}>&gt; personal reference</p>
              <h1 className="font-mono text-3xl sm:text-4xl leading-none tracking-tight" style={{ color: C.text, fontWeight: 600 }}>prompt_library</h1>
            </div>
            <div className="flex items-baseline gap-4 font-mono text-[10px] uppercase tracking-widest" style={{ color: C.textMuted }}>
              <span>vol.01</span><span style={{ color: C.border }}>·</span><span>{new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toLowerCase()}</span>
            </div>
          </div>
          <div className="flex items-end gap-0 -mb-px">
            <button onClick={() => setTab('prompts')} className="flex items-center gap-2 px-4 py-3 font-mono text-xs uppercase tracking-wider transition-colors"
              style={{ borderBottom: `2px solid ${tab === 'prompts' ? C.amber : 'transparent'}`, color: tab === 'prompts' ? C.amber : C.textMuted }}>
              <BookOpen size={14} />prompts<span className="ml-1" style={{ color: C.textMuted }}>· {(promptsData.prompts || []).length}</span>
            </button>
            <button onClick={() => setTab('resources')} className="flex items-center gap-2 px-4 py-3 font-mono text-xs uppercase tracking-wider transition-colors"
              style={{ borderBottom: `2px solid ${tab === 'resources' ? C.amber : 'transparent'}`, color: tab === 'resources' ? C.amber : C.textMuted }}>
              <Library size={14} />resources<span className="ml-1" style={{ color: C.textMuted }}>· {(resourcesData.resources || []).length}</span>
            </button>
          </div>
        </div>
      </header>

      {error && <ErrorBanner message={`Error: ${error}. Check prompts.json and resources.json.`} />}

      {loading ? (
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <p className="font-mono text-xs uppercase tracking-widest" style={{ color: C.textMuted }}>// Loading...</p>
        </div>
      ) : tab === 'prompts' ? (
        <PromptsTab data={promptsData} favorites={favorites} onToggleFavorite={toggleFavorite} onOpenPrompt={setOpenPrompt} />
      ) : (
        <ResourcesTab data={resourcesData} />
      )}

      <footer className="mt-16" style={{ borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between flex-wrap gap-2">
          <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: C.textMuted }}>
            // {tab === 'prompts' ? 'Edit prompts.json on GitHub to add entries' : 'Edit resources.json on GitHub to add entries'}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: C.textMuted }}>// Favorites saved in your browser</p>
        </div>
      </footer>

      {openPrompt && <PromptDetail prompt={openPrompt} onClose={() => setOpenPrompt(null)} isFavorite={favorites.has(openPrompt.id)} onToggleFavorite={toggleFavorite} />}
    </div>
  );
}
