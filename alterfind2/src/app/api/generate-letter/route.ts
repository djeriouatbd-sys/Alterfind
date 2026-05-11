import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, address, email, phone, parcours, company, poste, offre, groqKey, lang } = body

  if (!company || !poste) {
    return NextResponse.json({ error: 'Entreprise et poste requis' }, { status: 400 })
  }

  const key = groqKey || process.env.GROQ_API_KEY || ''

  const prompt = lang === 'en'
    ? `Write a professional cover letter in English for ${name || 'the candidate'} applying for ${poste} at ${company}. Background: ${parcours || 'student'}. Job description: ${offre || 'not provided'}. Write the complete letter with header, 3-4 body paragraphs and closing. No placeholders.`
    : `Rédige une lettre de motivation professionnelle en français pour ${name || 'le candidat'} qui postule au poste de ${poste} chez ${company}. Parcours : ${parcours || 'étudiant'}. Description du poste : ${offre || 'non fournie'}. Rédige la lettre complète avec en-tête, 3-4 paragraphes et formule de politesse. Pas de crochets ni placeholders.`

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1200
      })
    })

    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: err.error?.message || 'Erreur Groq' }, { status: 500 })
    }

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content || ''
    return NextResponse.json({ text })
  } catch (e) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
