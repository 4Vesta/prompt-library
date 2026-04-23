import { useState, useMemo, useEffect } from 'react';
import { Search, Copy, Check, BookOpen, X, Sparkles, Star, ExternalLink, Library, AlertCircle } from 'lucide-react';

const SOURCE_STYLES = {
  reddit: 'bg-orange-50 text-orange-900 border-orange-200',
  external: 'bg-blue-50 text-blue-900 border-blue-200',
  custom: 'bg-emerald-50 text-emerald-900 border-emerald-200',
};
const SOURCE_LABELS = { reddit: 'Reddit', external: 'External', custom: 'Custom' };

const RESOURCE_TYPE_STYLES = {
  library: 'bg-blue-50 text-blue-900 border-blue-200',
  reddit: 'bg-orange-50 text-orange-900 border-orange-200',
  reference: 'bg-violet-50 text-violet-900 border-violet-200',
  skip: 'bg-stone-100 text-stone-500 border-stone-300',
};
const RESOURCE_TYPE_LABELS = { library: 'Library', reddit: 'Reddit', reference: 'Reference', skip: 'Skip' };

const FAVORITES_KEY = 'prompt-library-favorites-v1';

function Badge({ children, className = '' }) {
  return <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border ${className}`}>{children}</span>;
}

function PromptCard({ prompt, onOpen, isFavorite, onToggleFavorite }) {
  const sourceStyle = SOURCE_STYLES[prompt.sourceType] || SOURCE_STYLES.custom;
  return (
    <div className="group relative border border-stone-300 bg-stone-50 hover:bg-white hover:border-stone-900 transition-all duration-200">
      <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(prompt.id); }}
        className={`absolute top-3 right-3 z-10 p-1 transition-colors ${isFavorite ? 'text-amber-500' : 'text-stone-300 hover:text-stone-700'}`}
        aria-label={isFavorite ? 'Unfavorite' : 'Favorite'}>
        <Star size={16} fill={isFavorite ? 'currentColor' : 'none'} />
      </button>
      <button onClick={() => onOpen(prompt)} className="w-full text-left p-5 pr-10">
        <div className="flex items-start gap-3 mb-3"><Badge className={sourceStyle}>{SOURCE_LABELS[prompt.sourceType] || prompt.sourceType}</Badge></div>
        <h3 className="font-serif text-lg text-stone-900 leading-tight mb-2">{prompt.name}</h3>
        <p className="text-sm text-stone-600 leading-relaxed mb-4 font-serif">{prompt.useCase}</p>
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            {(prompt.tags || []).slice(0, 4).map(tag => <span key={tag} className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">#{tag}</span>)}
          </div>
          <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider group-hover:text-stone-900 transition-colors">Open →</span>
        </div>
      </button>
    </div>
  );
}

function ResourceCard({ resource }) {
  const typeStyle = RESOURCE_TYPE_STYLES[resource.type] || RESOURCE_TYPE_STYLES.library;
  const isSkip = resource.type === 'skip';
  return (
    <a href={resource.url} target="_blank" rel="noopener noreferrer"
       className={`group relative block border bg-stone-50 hover:bg-white transition-all duration-200 p-5 ${isSkip ? 'border-stone-300 opacity-60 hover:opacity-100' : 'border-stone-300 hover:border-stone-900'}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <Badge className={typeStyle}>{RESOURCE_TYPE_LABELS[resource.type] || resource.type}</Badge>
        <ExternalLink size={14} className="text-stone-400 group-hover:text-stone-900 transition-colors flex-shrink-0" />
      </div>
      <h3 className="font-serif text-lg text-stone-900 leading-tight mb-2">{resource.name}</h3>
      {resource.description && (<p className="text-sm text-stone-600 leading-relaxed mb-3 font-serif">{resource.description}</p>)}
      {resource.notes && (<p className="text-xs text-stone-500 italic font-serif border-l-2 border-stone-300 pl-3">{resource.notes}</p>)}
      <p className="text-[10px] font-mono text-stone-400 mt-3 truncate">{resource.url.replace(/^https?:\/\//, '')}</p>
    </a>
  );
}

function ParameterInput({ param, value, onChange }) {
  const label = (
    <label className="block text-xs font-mono text-stone-700 mb-1.5">
      <span className="text-stone-900">[{param.key}]</span>
      {param.hint && <span className="text-stone-400 ml-2 normal-case">— {param.hint}</span>}
    </label>
  );
  if (param.type === 'textarea') return <div>{label}<textarea value={value || ''} onChange={(e) => onChange(e.target.value)} rows={3} className="w-full px-3 py-2 bg-white border border-stone-300 focus:border-stone-900 outline-none font-mono text-sm transition-colors resize-y" /></div>;
  if (param.type === 'dropdown') return (
    <div>{label}<select value={value || ''} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 bg-white border border-stone-300 focus:border-stone-900 outline-none font-mono text-sm transition-colors">
      <option value="">Select...</option>
      {(param.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select></div>
  );
  if (param.type === 'checkbox') return (
    <div><label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 accent-stone-900" />
      <span className="text-sm font-mono text-stone-800"><span className="text-stone-900">[{param.key}]</span>{param.label && <span className="ml-2 text-stone-600 normal-case font-serif">— {param.label}</span>}</span>
    </label></div>
  );
  return <div>{label}<input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 bg-white border border-stone-300 focus:border-stone-900 outline-none font-mono text-sm transition-colors" /></div>;
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
  const sourceStyle = SOURCE_STYLES[prompt.sourceType] || SOURCE_STYLES.custom;
  const hasParams = prompt.parameters && prompt.parameters.length > 0;
  return (
    <div className="fixed inset-0 bg-stone-900/40 z-50 flex items-start sm:items-center justify-center p-0 sm:p-6 overflow-y-auto">
      <div className="bg-stone-50 border-stone-900 border sm:border-2 w-full max-w-3xl my-0 sm:my-8 relative">
        <div className="sticky top-0 bg-stone-50 border-b border-stone-300 px-6 py-4 flex items-start justify-between gap-4 z-10">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={sourceStyle}>{SOURCE_LABELS[prompt.sourceType] || prompt.sourceType}</Badge>
              <button onClick={() => onToggleFavorite(prompt.id)} className={`p-1 transition-colors ${isFavorite ? 'text-amber-500' : 'text-stone-300 hover:text-stone-700'}`}>
                <Star size={14} fill={isFavorite ? 'currentColor' : 'none'} />
              </button>
            </div>
            <h2 className="font-serif text-2xl text-stone-900 leading-tight">{prompt.name}</h2>
            <p className="text-xs font-mono text-stone-500 mt-1">{prompt.source}</p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-900 transition-colors p-1"><X size={20} /></button>
        </div>
        <div className="px-6 py-6 space-y-6">
          <div>
            <h4 className="text-[10px] font-mono uppercase tracking-widest text-stone-500 mb-2">Use case</h4>
            <p className="font-serif text-stone-800 leading-relaxed">{prompt.useCase}</p>
          </div>
          {hasParams && (
            <div>
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-stone-500 mb-3">Fill in parameters</h4>
              <div className="space-y-4">
                {prompt.parameters.map(p => <ParameterInput key={p.key} param={p} value={paramValues[p.key]} onChange={(v) => setParamValues({ ...paramValues, [p.key]: v })} />)}
              </div>
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-stone-500">{hasParams ? 'Filled prompt' : 'Prompt'}</h4>
              <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider bg-stone-900 text-stone-50 px-3 py-1.5 hover:bg-stone-700 transition-colors">
                {copied ? <Check size={12} /> : <Copy size={12} />}{copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="bg-white border border-stone-300 p-4 font-mono text-xs text-stone-800 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">{filledPrompt}</div>
          </div>
        </div>
      </div>
    </div>
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
      <section className="border-b border-stone-300 bg-stone-50 sticky top-[73px] z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search prompts by name, tag, or use case..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-300 focus:border-stone-900 outline-none font-mono text-sm transition-colors" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => { setActiveCategory('all'); setShowFavoritesOnly(false); }} className={`text-[10px] font-mono uppercase tracking-wider px-3 py-1.5 border transition-colors ${activeCategory === 'all' && !showFavoritesOnly ? 'bg-stone-900 text-stone-50 border-stone-900' : 'bg-white text-stone-700 border-stone-300 hover:border-stone-900'}`}>All · {categoryCounts.all}</button>
            <button onClick={() => { setShowFavoritesOnly(!showFavoritesOnly); setActiveCategory('all'); }} className={`flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-3 py-1.5 border transition-colors ${showFavoritesOnly ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-stone-700 border-stone-300 hover:border-stone-900'}`}>
              <Star size={10} fill={showFavoritesOnly ? 'currentColor' : 'none'} />Favorites · {favorites.size}
            </button>
            <span className="text-stone-300 mx-1">·</span>
            {(data.categories || []).map(cat => (
              <button key={cat.id} onClick={() => { setActiveCategory(cat.id); setShowFavoritesOnly(false); }} disabled={categoryCounts[cat.id] === 0} className={`text-[10px] font-mono uppercase tracking-wider px-3 py-1.5 border transition-colors ${activeCategory === cat.id && !showFavoritesOnly ? 'bg-stone-900 text-stone-50 border-stone-900' : 'bg-white text-stone-700 border-stone-300 hover:border-stone-900'} ${categoryCounts[cat.id] === 0 ? 'opacity-40' : ''}`}>{cat.label} · {categoryCounts[cat.id] || 0}</button>
            ))}
          </div>
        </div>
      </section>
      <main className="max-w-5xl mx-auto px-6 py-8">
        {filtered.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-stone-300">
            <Sparkles size={24} className="mx-auto text-stone-400 mb-3" />
            <p className="font-serif text-stone-600 mb-1">No prompts match your filter.</p>
            <p className="font-mono text-xs text-stone-400 uppercase tracking-wider">Try a different query, category, or turn off favorites</p>
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
      <section className="border-b border-stone-300 bg-stone-50 sticky top-[73px] z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search resources by name or description..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-300 focus:border-stone-900 outline-none font-mono text-sm transition-colors" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setActiveType('all')} className={`text-[10px] font-mono uppercase tracking-wider px-3 py-1.5 border transition-colors ${activeType === 'all' ? 'bg-stone-900 text-stone-50 border-stone-900' : 'bg-white text-stone-700 border-stone-300 hover:border-stone-900'}`}>All · {typeCounts.all}</button>
            {Object.entries(RESOURCE_TYPE_LABELS).map(([type, label]) => (
              <button key={type} onClick={() => setActiveType(type)} disabled={typeCounts[type] === 0} className={`text-[10px] font-mono uppercase tracking-wider px-3 py-1.5 border transition-colors ${activeType === type ? 'bg-stone-900 text-stone-50 border-stone-900' : 'bg-white text-stone-700 border-stone-300 hover:border-stone-900'} ${typeCounts[type] === 0 ? 'opacity-40' : ''}`}>{label} · {typeCounts[type] || 0}</button>
            ))}
          </div>
        </div>
      </section>
      <main className="max-w-5xl mx-auto px-6 py-8">
        {filtered.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-stone-300">
            <Sparkles size={24} className="mx-auto text-stone-400 mb-3" />
            <p className="font-serif text-stone-600 mb-1">No resources match your filter.</p>
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
    <div className="bg-red-50 border-b border-red-300 px-6 py-3">
      <div className="max-w-5xl mx-auto flex items-center gap-2 text-red-900 text-sm font-mono">
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
    <div className="min-h-screen bg-stone-100 font-serif">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=JetBrains+Mono:wght@400;500&display=swap');.font-serif{font-family:'Fraunces',Georgia,serif}.font-mono{font-family:'JetBrains Mono',monospace}`}</style>
      <header className="border-b border-stone-900 bg-stone-50 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 pt-8 pb-0">
          <div className="flex items-baseline justify-between flex-wrap gap-2 mb-6">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-500 mb-2">Personal Reference</p>
              <h1 className="font-serif text-4xl sm:text-5xl text-stone-900 leading-none tracking-tight">Prompt Library</h1>
            </div>
            <div className="flex items-baseline gap-4 font-mono text-[10px] uppercase tracking-widest text-stone-500">
              <span>vol. 01</span><span className="text-stone-300">·</span><span>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
          <div className="flex items-end gap-0 border-b border-stone-300 -mb-px">
            <button onClick={() => setTab('prompts')} className={`flex items-center gap-2 px-5 py-3 text-xs font-mono uppercase tracking-wider border-b-2 transition-colors ${tab === 'prompts' ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-900'}`}>
              <BookOpen size={14} />Prompts<span className="text-stone-400 ml-1">· {(promptsData.prompts || []).length}</span>
            </button>
            <button onClick={() => setTab('resources')} className={`flex items-center gap-2 px-5 py-3 text-xs font-mono uppercase tracking-wider border-b-2 transition-colors ${tab === 'resources' ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-900'}`}>
              <Library size={14} />Resources<span className="text-stone-400 ml-1">· {(resourcesData.resources || []).length}</span>
            </button>
          </div>
        </div>
      </header>

      {error && <ErrorBanner message={`Error: ${error}. Check prompts.json and resources.json.`} />}

      {loading ? (
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-stone-500">Loading...</p>
        </div>
      ) : tab === 'prompts' ? (
        <PromptsTab data={promptsData} favorites={favorites} onToggleFavorite={toggleFavorite} onOpenPrompt={setOpenPrompt} />
      ) : (
        <ResourcesTab data={resourcesData} />
      )}

      <footer className="border-t border-stone-300 mt-16">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between flex-wrap gap-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-stone-500">
            {tab === 'prompts' ? 'Edit prompts.json on GitHub to add entries' : 'Edit resources.json on GitHub to add entries'}
          </p>
          <p className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Favorites saved in your browser</p>
        </div>
      </footer>

      {openPrompt && <PromptDetail prompt={openPrompt} onClose={() => setOpenPrompt(null)} isFavorite={favorites.has(openPrompt.id)} onToggleFavorite={toggleFavorite} />}
    </div>
  );
}
