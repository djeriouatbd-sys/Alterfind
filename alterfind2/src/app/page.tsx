'use client'

import { useState, useEffect, useRef } from 'react'

type Offer = {
  id: string
  title: string
  company: string
  location: string
  dist: number
  url: string
  type: string
  desc: string
  profil: string
  salaire?: string
}

type Candidature = {
  id: string
  company: string
  role: string
  type: string
  date: string
  status: string
  response: string
}

type CVProfile = {
  name?: string
  email?: string
  phone?: string
  address?: string
  title?: string
  skills?: string[]
  languages?: string[]
  searchKeywords?: string
  parcours?: string
}

const STATUSES = ['Envoyée', 'En attente', 'Entretien', 'Acceptée', 'Refusée']
const STATUS_COLOR: Record<string, string> = {
  'Envoyée': '#6c63ff',
  'En attente': '#ffc800',
  'Entretien': '#43e97b',
  'Acceptée': '#43e97b',
  'Refusée': '#ff6584',
}

const inp: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '10px 14px',
  color: 'var(--text)',
  fontSize: 13,
  outline: 'none',
}

const card: React.CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '1.2rem',
  marginBottom: '1rem',
}

export default function Home() {
  const [page, setPage] = useState<'search' | 'lettre' | 'suivi'>('search')
  const [lang, setLang] = useState<'fr' | 'en'>('fr')
  const [groqKey, setGroqKey] = useState('')
  const [cvProfile, setCvProfile] = useState<CVProfile | null>(null)
  const [cvLoading, setCvLoading] = useState(false)
  const [cvError, setCvError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Search
  const [keywords, setKeywords] = useState('')
  const [location, setLocation] = useState('')
  const [radius, setRadius] = useState('35')
  const [offers, setOffers] = useState<Offer[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [declined, setDeclined] = useState<Set<string>>(new Set())
  const [detail, setDetail] = useState<Offer | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)

  // Lettre
  const [lmName, setLmName] = useState('')
  const [lmAddress, setLmAddress] = useState('')
  const [lmEmail, setLmEmail] = useState('')
  const [lmPhone, setLmPhone] = useState('')
  const [lmParcours, setLmParcours] = useState('')
  const [lmCompany, setLmCompany] = useState('')
  const [lmPoste, setLmPoste] = useState('')
  const [lmOffre, setLmOffre] = useState('')
  const [lmText, setLmText] = useState('')
  const [lmLoading, setLmLoading] = useState(false)

  // Suivi
  const [candidatures, setCandidatures] = useState<Candidature[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [fCompany, setFCompany] = useState('')
  const [fRole, setFRole] = useState('')
  const [fType, setFType] = useState('alternance')

  const t = (fr: string, en: string) => lang === 'fr' ? fr : en

  useEffect(() => {
    const saved = localStorage.getItem('alterfind_v2')
    if (saved) setCandidatures(JSON.parse(saved))
    const k = localStorage.getItem('alterfind_groq')
    if (k) setGroqKey(k)
  }, [])

  const saveCandidatures = (c: Candidature[]) => {
    setCandidatures(c)
    localStorage.setItem('alterfind_v2', JSON.stringify(c))
  }

  const onCVFile = async (file: File) => {
    if (!file) return
    setCvLoading(true)
    setCvError('')
    const fd = new FormData()
    fd.append('cv', file)
    fd.append('lang', lang)
    if (groqKey) fd.append('groqKey', groqKey)
    try {
      const res = await fetch('/api/parse-cv', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const p: CVProfile = data.profile
      setCvProfile(p)
      if (p.name) setLmName(p.name)
      if (p.address) setLmAddress(p.address)
      if (p.email) setLmEmail(p.email)
      if (p.phone) setLmPhone(p.phone)
      if (p.parcours) setLmParcours(p.parcours)
      if (p.searchKeywords) setKeywords(p.searchKeywords)
      if (p.address) {
        const m = p.address.match(/\d{5}/)
        if (m) setLocation(m[0])
      }
    } catch (e: any) {
      setCvError(e.message)
    }
    setCvLoading(false)
  }

  const searchOffers = async () => {
    if (!keywords) return
    setSearchLoading(true)
    setOffers([])
    setSelected(new Set())
    setDeclined(new Set())
    setDetail(null)
    try {
      const res = await fetch('/api/search-offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords, location, radius })
      })
      const data = await res.json()
      setOffers(data.offers || [])
    } catch {
      setOffers([])
    }
    setSearchLoading(false)
  }

  const toggleSelect = (id: string) => {
    const s = new Set(selected)
    s.has(id) ? s.delete(id) : s.add(id)
    setSelected(s)
  }

  const declineOffer = (id: string) => {
    const d = new Set(declined)
    d.add(id)
    setDeclined(d)
    if (detail?.id === id) setDetail(null)
  }

  const addCandidature = (company: string, role: string, type = 'alternance') => {
    const c: Candidature = {
      id: Date.now().toString(),
      company,
      role: role.substring(0, 60),
      type,
      date: new Date().toLocaleDateString('fr-FR'),
      status: 'Envoyée',
      response: ''
    }
    saveCandidatures([c, ...candidatures])
  }

  const validateSelected = () => {
    const sel = offers.filter(o => selected.has(o.id))
    sel.forEach(o => {
      if (o.url !== '#') window.open(o.url, '_blank')
      addCandidature(o.company, o.title)
    })
    alert(t(`${sel.length} offre(s) ouvertes et ajoutées au suivi !`, `${sel.length} offer(s) opened and added to tracker!`))
    setSelected(new Set())
  }

  const generateLM = async () => {
    if (!lmCompany || !lmPoste) return
    setLmLoading(true)
    setLmText('')
    try {
      const res = await fetch('/api/generate-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: lmName, address: lmAddress, email: lmEmail, phone: lmPhone, parcours: lmParcours, company: lmCompany, poste: lmPoste, offre: lmOffre, groqKey, lang })
      })
      const data = await res.json()
      setLmText(data.text || data.error || 'Erreur')
    } catch {
      setLmText('Erreur de connexion')
    }
    setLmLoading(false)
  }

  const updateCandidature = (id: string, field: string, val: string) => {
    saveCandidatures(candidatures.map(c => c.id === id ? { ...c, [field]: val } : c))
  }

  const visibleOffers = offers.filter(o => !declined.has(o.id))

  const stats = {
    total: candidatures.length,
    wait: candidatures.filter(c => ['Envoyée', 'En attente', 'Entretien'].includes(c.status)).length,
    yes: candidatures.filter(c => c.status === 'Acceptée').length,
    no: candidatures.filter(c => c.status === 'Refusée').length,
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* NAV */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'rgba(10,10,15,0.92)', backdropFilter: 'blur(12px)', zIndex: 100 }}>
        <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '1.4rem', background: 'linear-gradient(135deg,#6c63ff,#ff6584)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          AlterFind
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg2)', borderRadius: 10, padding: 4 }}>
          {(['search', 'lettre', 'suivi'] as const).map(p => (
            <button key={p} onClick={() => setPage(p)} style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: page === p ? 'var(--accent)' : 'transparent', color: page === p ? 'white' : 'var(--text2)', fontSize: 13, cursor: 'pointer' }}>
              {p === 'search' ? t('🔍 Offres', '🔍 Jobs') : p === 'lettre' ? t('✉️ Lettre', '✉️ Letter') : t('📋 Suivi', '📋 Tracker')}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {cvProfile && <span style={{ fontSize: 11, color: 'var(--accent3)', background: 'rgba(67,233,123,0.1)', padding: '3px 10px', borderRadius: 99 }}>✓ CV chargé</span>}
          <button onClick={() => setLang(l => l === 'fr' ? 'en' : 'fr')} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 12px', color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }}>
            🌐 {lang === 'fr' ? 'EN' : 'FR'}
          </button>
        </div>
      </nav>

      <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>

        {/* GROQ KEY */}
        <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--text2)', marginBottom: '1rem' }}>
          🔑 {t('Clé Groq gratuite sur', 'Free Groq key at')} <a href="https://console.groq.com" target="_blank" style={{ color: 'var(--accent)' }}>console.groq.com</a> :
          <input value={groqKey} onChange={e => { setGroqKey(e.target.value); localStorage.setItem('alterfind_groq', e.target.value) }} placeholder="gsk_..." style={{ ...inp, flex: 1, fontSize: 12 }} />
        </div>

        {/* CV UPLOADER */}
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
            📄 {t('Importe ton CV – auto-remplissage des formulaires', 'Import your CV – auto-fill forms')}
          </div>
          <div
            onClick={() => fileRef.current?.click()}
            style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', background: 'var(--bg2)' }}
          >
            <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) onCVFile(f) }} />
            {cvLoading ? <p style={{ color: 'var(--text2)' }}>⏳ {t('Analyse en cours...', 'Analyzing...')}</p>
              : cvProfile ? <p style={{ color: 'var(--accent3)' }}>✅ {t('CV analysé –', 'CV analyzed –')} {cvProfile.name} · <span style={{ color: 'var(--accent)', cursor: 'pointer' }}>{t('Changer', 'Change')}</span></p>
                : <p style={{ color: 'var(--text2)', fontSize: 13 }}>📁 {t('Glisse ton CV ici ou clique (PDF, PNG, JPG)', 'Drag your CV here or click (PDF, PNG, JPG)')}</p>}
          </div>
          {cvError && <p style={{ color: 'var(--accent2)', fontSize: 12, marginTop: 8 }}>⚠️ {cvError}</p>}
          {cvProfile?.skills && cvProfile.skills.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {cvProfile.skills.map((s, i) => (
                <span key={i} style={{ background: 'rgba(108,99,255,0.1)', color: 'var(--accent)', fontSize: 11, padding: '2px 8px', borderRadius: 99 }}>{s}</span>
              ))}
            </div>
          )}
        </div>

        {/* ── SEARCH ── */}
        {page === 'search' && (
          <div>
            <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: '2.2rem', fontWeight: 800, marginBottom: '1.5rem', textAlign: 'center' }}>
              {t('Trouve ton', 'Find your')} <span style={{ background: 'linear-gradient(135deg,#6c63ff,#ff6584)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t('alternance', 'apprenticeship')}</span>
            </h1>

            <div style={card}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>{t('Mots-clés', 'Keywords')}</label>
                  <input value={keywords} onChange={e => setKeywords(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchOffers()} placeholder={t('ex: management sport...', 'e.g. sport management...')} style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>{t('Ville / Code postal', 'City / Postal code')}</label>
                  <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Paris, 95200..." style={inp} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <button onClick={searchOffers} disabled={searchLoading || !keywords} style={{ background: 'linear-gradient(135deg,#6c63ff,#5850e0)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', padding: '10px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer', opacity: (!keywords || searchLoading) ? 0.5 : 1 }}>
                    {searchLoading ? '...' : t('Rechercher', 'Search')}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 12, color: 'var(--text2)' }}>{t('Rayon :', 'Radius:')}</label>
                <select value={radius} onChange={e => setRadius(e.target.value)} style={{ ...inp, width: 'auto', padding: '4px 10px' }}>
                  {['10', '20', '35', '50'].map(r => <option key={r} value={r}>{r} km</option>)}
                </select>
              </div>
            </div>

            {/* Detail panel */}
            {detail && (
              <div style={{ ...card, borderColor: 'rgba(108,99,255,0.4)' }}>
                <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 18, marginBottom: 6 }}>{detail.title}</div>
                <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 12 }}>{detail.company} · {detail.location} · {detail.dist}km</div>
                {[{ l: t('Type', 'Type'), v: detail.type }, { l: t('Missions', 'Missions'), v: detail.desc }, { l: t('Profil', 'Profile'), v: detail.profil }].map(({ l, v }) => (
                  <div key={l}>
                    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent)', margin: '10px 0 4px' }}>{l}</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>{v}</div>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={() => { toggleSelect(detail.id); setDetail(null) }} style={{ background: 'rgba(67,233,123,0.1)', border: '1px solid rgba(67,233,123,0.3)', color: '#43e97b', borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>
                    {selected.has(detail.id) ? t('✗ Désélectionner', '✗ Deselect') : t('✓ Sélectionner', '✓ Select')}
                  </button>
                  <button onClick={() => { declineOffer(detail.id); setDetail(null) }} style={{ background: 'rgba(255,101,132,0.1)', border: '1px solid rgba(255,101,132,0.3)', color: '#ff6584', borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>
                    {t('✗ Décliner', '✗ Decline')}
                  </button>
                  <button onClick={() => setDetail(null)} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 14px', color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }}>
                    {t('← Fermer', '← Close')}
                  </button>
                </div>
              </div>
            )}

            {searchLoading && (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text2)' }}>
                <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
                {t('Recherche en cours...', 'Searching...')}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {visibleOffers.map(o => {
                const isSel = selected.has(o.id)
                return (
                  <div key={o.id} onClick={() => setDetail(o)} style={{ background: isSel ? 'rgba(108,99,255,0.05)' : 'var(--card)', border: `1px solid ${isSel ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--radius)', padding: '1rem 1.2rem', display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', transition: 'border 0.2s' }}>
                    <div onClick={e => { e.stopPropagation(); toggleSelect(o.id) }} style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${isSel ? 'var(--accent)' : 'var(--border)'}`, background: isSel ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                      {isSel && <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="2,5 4,8 8,2" stroke="white" strokeWidth="2" fill="none" /></svg>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{o.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <span>🏢 {o.company}</span><span>📍 {o.location}</span>
                        <span style={{ background: 'rgba(108,99,255,0.15)', color: 'var(--accent)', fontSize: 10, padding: '2px 8px', borderRadius: 99 }}>{o.dist}km</span>
                      </div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); declineOffer(o.id) }} style={{ background: 'transparent', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>✗</button>
                  </div>
                )
              })}
            </div>

            {!searchLoading && visibleOffers.length === 0 && (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text2)', fontSize: 14 }}>
                {cvProfile ? t('Clique sur Rechercher pour trouver des offres', 'Click Search to find offers') : t('Lance une recherche pour voir les offres', 'Start a search to see offers')}
              </div>
            )}

            {selected.size > 0 && (
              <div style={{ position: 'sticky', bottom: '1rem', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
                <span style={{ fontSize: 13, color: 'var(--text2)' }}><strong style={{ color: 'var(--text)' }}>{selected.size}</strong> {t('offre(s) sélectionnée(s)', 'offer(s) selected')}</span>
                <button onClick={validateSelected} style={{ background: 'linear-gradient(135deg,#6c63ff,#5850e0)', color: 'white', border: 'none', borderRadius: 8, padding: '8px 20px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  {t('Valider et postuler →', 'Validate & Apply →')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── LETTRE ── */}
        {page === 'lettre' && (
          <div>
            <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: '2.2rem', fontWeight: 800, marginBottom: '1.5rem', textAlign: 'center' }}>
              {t('Génère ta', 'Generate your')} <span style={{ background: 'linear-gradient(135deg,#ff6584,#6c63ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t('lettre de motivation', 'cover letter')}</span>
            </h1>
            {cvProfile && <p style={{ color: 'var(--accent3)', fontSize: 13, textAlign: 'center', marginBottom: '1rem' }}>✓ {t('Formulaire pré-rempli depuis ton CV', 'Form pre-filled from your CV')}</p>}

            <div style={card}>
              <div style={{ fontSize: 12, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>{t('TON PROFIL', 'YOUR PROFILE')}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                {[
                  { label: t('Prénom Nom', 'Full Name'), val: lmName, set: setLmName, ph: 'Badr Djeriouat' },
                  { label: t('Adresse', 'Address'), val: lmAddress, set: setLmAddress, ph: '2 Av du 8 mai...' },
                  { label: 'Email', val: lmEmail, set: setLmEmail, ph: 'email@gmail.com' },
                  { label: t('Téléphone', 'Phone'), val: lmPhone, set: setLmPhone, ph: '06 XX XX XX XX' },
                ].map(({ label, val, set, ph }) => (
                  <div key={label}>
                    <label style={{ fontSize: 11, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>{label}</label>
                    <input value={val} onChange={e => set(e.target.value)} placeholder={ph} style={inp} />
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>{t('Ton parcours', 'Your background')}</label>
                <textarea value={lmParcours} onChange={e => setLmParcours(e.target.value)} rows={3} placeholder={t('Ex: TP Négociateur Commercial, téléprospection EL Energy...', 'E.g. Bachelor in Business, 1 year sales experience...')} style={{ ...inp, resize: 'vertical' }} />
              </div>

              <div style={{ fontSize: 12, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>{t("L'OFFRE", 'THE JOB')}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>{t('Entreprise', 'Company')}</label>
                  <input value={lmCompany} onChange={e => setLmCompany(e.target.value)} placeholder="NRJ Audio" style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>{t('Poste', 'Position')}</label>
                  <input value={lmPoste} onChange={e => setLmPoste(e.target.value)} placeholder="Alternant Communication" style={inp} />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>{t("Description de l'offre", 'Job description')}</label>
                <textarea value={lmOffre} onChange={e => setLmOffre(e.target.value)} rows={3} placeholder={t('Collez la description du poste...', 'Paste the job description...')} style={{ ...inp, resize: 'vertical' }} />
              </div>

              <button onClick={generateLM} disabled={lmLoading || !lmCompany || !lmPoste} style={{ width: '100%', background: 'linear-gradient(135deg,#ff6584,#6c63ff)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', padding: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: (!lmCompany || !lmPoste || lmLoading) ? 0.5 : 1 }}>
                {lmLoading ? t('⏳ Génération...', '⏳ Generating...') : t('✦ Générer la lettre', '✦ Generate letter')}
              </button>
            </div>

            {lmText && (
              <div>
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', fontSize: 13, lineHeight: 1.9, color: 'var(--text2)', whiteSpace: 'pre-wrap' }}>{lmText}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button onClick={() => navigator.clipboard.writeText(lmText).then(() => alert(t('Copié !', 'Copied!')))} style={{ background: 'var(--accent)', border: 'none', borderRadius: 8, padding: '8px 18px', color: 'white', fontSize: 13, cursor: 'pointer' }}>
                    📋 {t('Copier', 'Copy')}
                  </button>
                  <button onClick={() => { addCandidature(lmCompany, lmPoste); setPage('suivi') }} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', color: 'var(--text2)', fontSize: 13, cursor: 'pointer' }}>
                    + {t('Ajouter au suivi', 'Add to tracker')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SUIVI ── */}
        {page === 'suivi' && (
          <div>
            <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: '2.2rem', fontWeight: 800, marginBottom: '1.5rem', textAlign: 'center' }}>
              {t('Suivi des', 'Application')} <span style={{ background: 'linear-gradient(135deg,#43e97b,#6c63ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t('candidatures', 'Tracker')}</span>
            </h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: '1.5rem' }}>
              {[
                { n: stats.total, l: 'Total', c: '#f0f0f8' },
                { n: stats.wait, l: t('En cours', 'Pending'), c: '#6c63ff' },
                { n: stats.yes, l: t('Acceptées', 'Accepted'), c: '#43e97b' },
                { n: stats.no, l: t('Refus', 'Rejected'), c: '#ff6584' },
              ].map(({ n, l, c }) => (
                <div key={l} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '2rem', fontWeight: 800, color: c }}>{n}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 3 }}>{l}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.8rem' }}>
              <button onClick={() => setShowAdd(!showAdd)} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 14px', color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }}>
                + {t('Ajouter', 'Add')}
              </button>
            </div>

            {showAdd && (
              <div style={{ ...card }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <input value={fCompany} onChange={e => setFCompany(e.target.value)} placeholder={t('Entreprise', 'Company')} style={inp} />
                  <input value={fRole} onChange={e => setFRole(e.target.value)} placeholder={t('Poste', 'Position')} style={inp} />
                  <select value={fType} onChange={e => setFType(e.target.value)} style={inp}>
                    <option value="alternance">Alternance</option>
                    <option value="cdd">CDD</option>
                    <option value="cdi">CDI</option>
                    <option value="stage">Stage</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { if (!fCompany) return; addCandidature(fCompany, fRole, fType); setFCompany(''); setFRole(''); setShowAdd(false) }} style={{ background: 'var(--accent)', border: 'none', borderRadius: 8, padding: '7px 16px', color: 'white', fontSize: 13, cursor: 'pointer' }}>{t('Ajouter', 'Add')}</button>
                  <button onClick={() => setShowAdd(false)} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 14px', color: 'var(--text2)', fontSize: 13, cursor: 'pointer' }}>{t('Annuler', 'Cancel')}</button>
                </div>
              </div>
            )}

            {candidatures.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text2)', fontSize: 14 }}>
                {t('Aucune candidature. Commence par rechercher des offres !', 'No applications yet. Start searching for jobs!')}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {[t('Entreprise', 'Company'), t('Type', 'Type'), t('Date', 'Date'), t('Statut', 'Status'), t('Note', 'Note'), ''].map(h => (
                        <th key={h} style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text2)', textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {candidatures.map(c => (
                      <tr key={c.id}>
                        <td style={{ padding: '10px', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{c.company}</div>
                          <div style={{ fontSize: 11, color: 'var(--text2)' }}>{c.role}</div>
                        </td>
                        <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text2)' }}>{c.type}</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text2)' }}>{c.date}</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid var(--border)' }}>
                          <select value={c.status} onChange={e => updateCandidature(c.id, 'status', e.target.value)} style={{ fontSize: 11, padding: '3px 6px', borderRadius: 6, background: 'var(--bg2)', border: '1px solid var(--border)', color: STATUS_COLOR[c.status] || 'var(--text)' }}>
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '10px', borderBottom: '1px solid var(--border)' }}>
                          <input value={c.response} onChange={e => updateCandidature(c.id, 'response', e.target.value)} placeholder="Note..." style={{ fontSize: 11, padding: '4px 8px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text2)', width: '100%' }} />
                        </td>
                        <td style={{ padding: '10px', borderBottom: '1px solid var(--border)' }}>
                          <button onClick={() => saveCandidatures(candidatures.filter(x => x.id !== c.id))} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 18 }}>×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
