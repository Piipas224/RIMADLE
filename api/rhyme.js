export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { guess, base } = req.body;
    if (!guess || !base) {
        return res.status(400).json({ error: 'Missing params' });
    }

    const prompt = 'Eres un experto en rimas españolas. Analiza estas dos palabras:\n\nBase: "' + base + '"\nCandidata: "' + guess + '"\n\nSigue estos pasos:\n1. Extrae la terminacion de "' + base + '" desde su vocal tonica (ej: CARTA→arta, LECHE→eche, PELO→elo, AMOR→or)\n2. Extrae la terminacion de "' + guess + '" desde su vocal tonica\n3. Si las terminaciones son IDENTICAS → tipo_rima = consonante\n4. Si solo coinciden las VOCALES de las terminaciones → tipo_rima = asonante\n5. Si no coinciden en nada → tipo_rima = ninguna\n\nEjemplos correctos:\n- LECHE(eche) vs BROCHE(oche) → ninguna\n- LECHE(eche) vs VERDE(e-e) → asonante\n- LECHE(eche) vs FLECHE(eche) → consonante\n- PELO(elo) vs CIELO(elo) → consonante\n- PELO(elo) vs FUEGO(e-o) → asonante\n- CARTA(arta) vs MARTA(arta) → consonante\n- CARTA(arta) vs CALMA(a-a) → asonante\n- AMOR(or) vs CALOR(or) → consonante\n- NOCHE(oche) vs CORRE(o-e) → asonante\n\nResponde SOLO con este JSON sin backticks:\n{"es_palabra_real":true,"terminacion_base":"xxx","terminacion_candidata":"xxx","tipo_rima":"consonante","complejidad":5,"explicacion":"breve"}';

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + process.env.GROQ_API_KEY
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                max_tokens: 200,
                temperature: 0,
                messages: [
                    {
                        role: 'system',
                        content: 'Eres un experto en fonética y métrica española. Respondes SOLO con JSON válido, sin texto extra, sin backticks.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            })
        });

        const data = await response.json();
        console.log('Groq status:', response.status, 'response:', JSON.stringify(data).slice(0, 200));

        if (!data.choices || !data.choices[0]) {
            console.error('Unexpected Groq response:', JSON.stringify(data));
            return res.status(500).json({ error: 'Unexpected response', detail: data.error || data });
        }

        const text = data.choices[0].message.content || '';
        const clean = text.replace(/```[a-z]*/g, '').replace(/```/g, '').trim();
        const result = JSON.parse(clean);
        return res.status(200).json(result);

    } catch (err) {
        console.error('Groq error:', err.message);
        return res.status(500).json({ error: err.message });
    }
}
