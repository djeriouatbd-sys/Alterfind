export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const FT_ID = 'PAR_alterfind2_18b1396f135ae37888714e3fe5203d0c2cc79cf365afff89e06e9fbe4d157fec'
  const FT_SECRET = '030384aa1c4542a3b5a12bdca2649e6e635265f9728dfad82954f1f474a8b17e'

  const response = await fetch('https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${FT_ID}&client_secret=${FT_SECRET}&scope=api_offresdemploiv2+o2dsoffre`
  })

  const data = await response.json()
  res.status(200).json(data)
}
