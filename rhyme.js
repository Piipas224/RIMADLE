export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { guess, base } = req.body;
    if (!guess || !base) {
        return res.status(400).json({ error: 'Missing guess or base' });
    }

    const prompt = `Eres un experto en métrica y fonética española. Evalúa si dos palabras riman.

Palabra base: "${base}"
Palabra candidata: "${guess}"

REGLAS ESTRICTAS:
- Rima CONSONANTE: coinciden EXACTAMENTE todos los sonidos desde la vocal tónica hasta el final.
- Rima ASONANTE: coinciden SOLO LAS VOCALES desde la vocal tónica hasta el final, ignorando consonantes. Ejemplo: "muelle" (patrón U-E) rima asonante con "mugre" (U-E), "fuente" (U-E), "dulce" (U-E), "cumbre" (U-E), "suerte" (U-E).
- Para la vocal tónica: en palabras llanas es la penúltima sílaba, en agudas la última, en esdrújulas la antepenúltima.
- Los diptongos cuentan como vocales separadas: "muelle" tiene tónica U y postónica E → patrón U-E.
- Sé GENEROSO con la rima asonante: si el patrón vocálico coincide, es asonante.

Pasos:
1. ¿Es "${guess}" una palabra real del español?
2. Identifica el patrón vocálico de "${base}" desde su vocal tónica.
3. Identifica el patrón vocálico de "${guess}" desde su vocal tónica.
4. ¿Coinciden exactamente todos los sonidos? → consonante. ¿Coinciden solo las vocales? → asonante. ¿No coinciden? → ninguna.
5. Complejidad de "${guess}": 1-10 (1=monosílabo común, 10=palabra larga/técnica/literaria rara).

Responde SOLO con JSON, sin nada más, sin backticks:
{
  "es_palabra_real": true/false,
  "patron_base": "vocales desde tónica de la base",
  "patron_candidata": "vocales desde tónica de la candidata",
  "tipo_rima": "consonante" | "asonante" | "ninguna",
  "complejidad": 1-10,
  "explicacion": "frase corta"
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
                model: 'claude-haiku-4-5-20251001',
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
