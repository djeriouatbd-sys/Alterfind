import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('cv') as File
  const lang = (formData.get('lang') as string) || 'fr'
  const groqKey = (formData.get('groqKey') as string) || process.env.GROQ_API_KEY || ''

  if (!file) {
    return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
  }

  try {
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = file.type || 'application/pdf'

    const prompt = lang === 'en'
      ? `Extract all information from this CV/resume and return ONLY a valid JSON object with these fields (no markdown, no explanation):
{"name":"","email":"","phone":"","address":"","title":"","skills":[],"languages":[],"searchKeywords":"3-5 job keywords","parcours":"2-3 sentence background summary for cover letter"}`
      : `Extrais toutes les informations de ce CV et retourne UNIQUEMENT un objet JSON valide avec ces champs (sans markdown, sans explication):
{"name":"","email":"","phone":"","address":"","title":"","skills":[],"languages":[],"searchKeywords":"3-5 mots-clés emploi","parcours":"Résumé du parcours en 2-3 phrases pour lettre de motivation"}`

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqKey}`
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } }
          ]
        }],
        max_tokens: 800,
        temperature: 0.1
      })
    })

    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: err.error?.message || 'Erreur Groq' }, { status: 500 })
    }

    const data = await res.json()
    let text = data.choices?.[0]?.message?.content || '{}'
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const profile = JSON.parse(text)
    return NextResponse.json({ profile })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erreur parsing CV' }, { status: 500 })
  }
}
