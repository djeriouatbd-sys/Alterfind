import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { keywords, location, radius } = await req.json()

  const clientId = process.env.FRANCE_TRAVAIL_CLIENT_ID || ''
  const clientSecret = process.env.FRANCE_TRAVAIL_CLIENT_SECRET || ''

  if (!clientId || !clientSecret) {
    return NextResponse.json({ offers: getDemoOffers(keywords, location), demo: true })
  }

  try {
    const tokenRes = await fetch(
      'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
          scope: 'api_offresdemploiv2 o2dsoffre'
        })
      }
    )

    if (!tokenRes.ok) {
      return NextResponse.json({ offers: getDemoOffers(keywords, location), demo: true })
    }

    const { access_token } = await tokenRes.json()

    const params = new URLSearchParams({
      motsCles: keywords || 'alternance',
      commune: location || '95200',
      distance: radius || '35',
      natureContrat: 'E2',
      nbResultats: '15',
    })

    const offresRes = await fetch(
      `https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search?${params}`,
      { headers: { Authorization: `Bearer ${access_token}`, Accept: 'application/json' } }
    )

    if (!offresRes.ok) {
      return NextResponse.json({ offers: getDemoOffers(keywords, location), demo: true })
    }

    const data = await offresRes.json()
    const offers = (data.resultats || []).map((o: any) => ({
      id: o.id,
      title: o.intitule,
      company: o.entreprise?.nom || 'Entreprise',
      location: o.lieuTravail?.libelle || '',
      dist: Math.round(o.lieuTravail?.distance || 0),
      url: o.origineOffre?.urlOrigine || `https://candidat.francetravail.fr/offres/recherche/detail/${o.id}`,
      type: o.typeContratLibelle || o.typeContrat || 'Alternance',
      desc: o.description || '',
      profil: (o.competences || []).map((c: any) => c.libelle).join(', ') || 'Voir offre',
      salaire: o.salaire?.libelle || '',
    }))

    return NextResponse.json({ offers })
  } catch {
    return NextResponse.json({ offers: getDemoOffers(keywords, location), demo: true })
  }
}

function getDemoOffers(kw: string, loc: string) {
  return [
    { id: 'd1', title: `Alternance – ${kw || 'Commercial'} Junior`, company: 'SportCo', location: loc || 'Paris 75', dist: 12, url: '#', type: 'Alternance · Bac+3', desc: 'Prospection BtoB, gestion portefeuille clients, CRM.', profil: 'Bac+3 commerce. Dynamique, autonome.', salaire: '' },
    { id: 'd2', title: 'Chargé de projet Événementiel', company: 'EventGroup', location: loc || 'Boulogne 92', dist: 18, url: '#', type: 'Alternance · 1 100€/mois', desc: 'Organisation événements, gestion prestataires, communication.', profil: 'Bac+3 marketing. Rigoureux, organisé.', salaire: '1100' },
    { id: 'd3', title: 'Business Developer Sport', company: 'SportStart', location: loc || 'Saint-Denis 93', dist: 8, url: '#', type: 'Alternance · Commission', desc: 'Développement réseau partenaires, pitch commercial.', profil: 'Bac+3. Pugnace, affinité sport.', salaire: '' },
    { id: 'd4', title: 'Assistant marketing digital', company: 'FitBrand', location: loc || 'Argenteuil 95', dist: 10, url: '#', type: 'Alternance · Tickets resto', desc: 'Réseaux sociaux, community management, création contenu.', profil: 'Bac+3. Créatif, maîtrise outils digitaux.', salaire: '' },
    { id: 'd5', title: 'Alternant communication', company: 'MediaSport', location: loc || 'Cergy 95', dist: 22, url: '#', type: 'Alternance 12 mois', desc: 'Vidéos, newsletters, organisation événements.', profil: 'Bac+3. Canva, CapCut.', salaire: '' },
  ]
}
