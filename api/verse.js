export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { poem } = req.body;
    if (!poem || poem.trim().length < 5) {
        return res.status(400).json({ error: 'Missing poem' });
    }

    const lines = poem.split('\n').filter(l => l.trim().length > 0);
    const n = lines.length;

    const prompt = 'Eres un experto en poesia y metrica espanola. Analiza esta estrofa:\n\n' +
        lines.map((l, i) => (i + 1) + '. ' + l).join('\n') +
        '\n\nEl verso 1 fue dado. Los demas los escribio un jugador.\n\n' +
        'TAREA:\n' +
        '1. Para cada verso identifica su ultima palabra y la terminacion desde la vocal tonica.\n' +
        '2. Asigna letras de rima: si dos versos riman en consonante o asonante comparten letra. Empieza por A.\n' +
        '3. Devuelve exactamente ' + n + ' letras en el array "letras", una por verso en orden.\n' +
        '4. Valora del 1-10: rima, sentido, creatividad, fluidez.\n' +
        '5. Comentario poetico breve en espanol.\n' +
        '6. Puntos: versos_usuario x 60 x (media_puntuaciones/10).\n\n' +
        'Responde SOLO con JSON sin backticks:\n' +
        '{"letras":["A","B","A","B"],"comentario":"texto","rima":8,"sentido":7,"creatividad":8,"fluidez":7,"puntos":420}';

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + process.env.GROQ_API_KEY
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                max_tokens: 300,
                temperature: 0,
                messages: [
                    {
                        role: 'system',
                        content: 'Eres un experto en poesia espanola. Respondes SOLO con JSON valido, sin texto extra, sin backticks.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            })
        });

        const data = await response.json();
        console.log('Groq verse status:', response.status);

        if (!data.choices || !data.choices[0]) {
            return res.status(500).json({ error: 'Unexpected response', detail: data.error || data });
        }

        const text = data.choices[0].message.content || '';
        const clean = text.replace(/```[a-z]*/g, '').replace(/```/g, '').trim();
        const result = JSON.parse(clean);

        // Derive scheme and description from letters (server-side, always consistent)
        const letters = result.letras || [];
        const scheme = letters.join('');

        const schemeMap = {
            'AABB': 'Pareados',
            'ABAB': 'Rima cruzada',
            'ABBA': 'Rima abrazada',
            'AAAA': 'Monorrima',
            'AABBCC': 'Sextilla',
            'ABABAB': 'Sexteto',
            'ABCABC': 'Rima alternada',
        };

        // Count unique letters to describe
        const unique = new Set(letters).size;
        let descripcion = schemeMap[scheme] || (unique <= 2 ? 'Rima consonante' : unique === letters.length ? 'Verso libre' : 'Esquema mixto');

        return res.status(200).json({
            esquema: scheme,
            descripcion,
            letras: letters,
            comentario: result.comentario || '',
            rima: result.rima || 5,
            sentido: result.sentido || 5,
            creatividad: result.creatividad || 5,
            fluidez: result.fluidez || 5,
            puntos: result.puntos || (n - 1) * 60,
        });

    } catch (err) {
        console.error('Groq verse error:', err.message);
        return res.status(500).json({ error: err.message });
    }
}
