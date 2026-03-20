export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { guess, base } = req.body;
    if (!guess || !base) {
        return res.status(400).json({ error: 'Missing guess or base' });
    }

    const prompt = 'Eres un experto en rimas españolas. Analiza estas dos palabras:\n\nBase: "' + base + '"\nCandidata: "' + guess + '"\n\nSigue estos pasos:\n1. Extrae la terminacion de "' + base + '" desde su vocal tonica (ej: CARTA→arta, LECHE→eche, PELO→elo)\n2. Extrae la terminacion de "' + guess + '" desde su vocal tonica\n3. Si las terminaciones son IDENTICAS → consonante\n4. Si solo coinciden las VOCALES de las terminaciones → asonante\n5. Si no coinciden → ninguna\n\nEjemplos:\n- LECHE(eche) y FLECHE(eche) → consonante\n- LECHE(eche) y VERDE(e-e) → asonante (ambas tienen e-e)\n- LECHE(eche) y CASA(a-a) → ninguna\n- PELO(elo) y CIELO(elo) → consonante\n- PELO(elo) y FUEGO(e-o) → asonante\n\nResponde SOLO con este JSON exacto sin backticks:\n{"es_palabra_real":true,"terminacion_base":"xxx","terminacion_candidata":"xxx","tipo_rima":"consonante","complejidad":5,"explicacion":"breve"}';

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
                max_tokens: 200,
                messages: [{ role: 'user', content: prompt }]
            })
        });

        const data = await response.json();
        console.log('Status:', response.status, 'Data:', JSON.stringify(data).slice(0, 300));

        if (!data.content || !data.content[0]) {
            console.error('Unexpected API response:', JSON.stringify(data));
            return res.status(500).json({ error: 'Unexpected API response', detail: data.error || data });
        }

        const text = data.content[0].text || '';
        const clean = text.replace(/```[a-z]*/g, '').replace(/```/g, '').trim();
        const result = JSON.parse(clean);
        return res.status(200).json(result);

    } catch (err) {
        console.error('Error:', err.message);
        return res.status(500).json({ error: err.message });
    }
}
