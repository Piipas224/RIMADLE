export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { guess, base } = req.body;
    if (!guess || !base) {
        return res.status(400).json({ error: 'Missing guess or base' });
    }

    const prompt = `Eres un experto en métrica y fonética española. Evalúa con MAXIMA PRECISION si dos palabras riman.

Palabra base: "${base}"
Palabra candidata: "${guess}"

DEFINICIONES EXACTAS:
- Rima CONSONANTE: desde la ultima vocal TONICA, coinciden TODOS los sonidos (vocales Y consonantes). Ejemplo: CARTA/MARTA=consonante (ambas terminan en "arta"), PELO/CIELO=consonante (ambas en "elo"), AMOR/CALOR=consonante (ambas en "or").
- Rima ASONANTE: desde la ultima vocal TONICA, coinciden SOLO las vocales, las consonantes son DISTINTAS. Ejemplo: CARTA(A-A)/CALMA(A-A)=asonante porque "arta" != "alma". PELO(E-O)/FUEGO(E-O)=asonante porque "elo" != "ego".
- NINGUNA: los patrones vocalicos no coinciden.

PROCESO OBLIGATORIO paso a paso:
1. Es "${guess}" una palabra real del espanol?
2. Cual es la terminacion exacta de "${base}" desde su vocal tonica? (escribe todas las letras)
3. Cual es la terminacion exacta de "${guess}" desde su vocal tonica? (escribe todas las letras)
4. Son IDENTICAS las terminaciones? Si SI -> consonante. Si NO, coinciden solo las vocales? Si SI -> asonante. Si NO -> ninguna.
5. Complejidad de "${guess}": 1=monosilabo muy comun, 10=palabra larga o tecnica muy rara.

Responde SOLO con JSON sin backticks ni texto extra:
{
  "es_palabra_real": true,
  "terminacion_base": "terminacion de la base",
  "terminacion_candidata": "terminacion de la candidata",
  "patron_base": "solo vocales",
  "patron_candidata": "solo vocales",
  "tipo_rima": "consonante",
  "complejidad": 5,
  "explicacion": "explicacion breve"
}`;

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-5-20250514',
                max_tokens: 400,
                messages: [{ role: 'user', content: prompt }]
            })
        });

        const data = await response.json();
        const text = data.content.map(b => b.text || '').join('').trim();
        const clean = text.replace(/```json|```/g, '').trim();
        const result = JSON.parse(clean);
        return res.status(200).json(result);

    } catch (err) {
        console.error('Anthropic API error:', err);
        return res.status(500).json({ error: 'API error' });
    }
}
