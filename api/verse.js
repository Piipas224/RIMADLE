export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { poem } = req.body;
    if (!poem || poem.trim().length < 5) {
        return res.status(400).json({ error: 'Missing poem' });
    }

    const prompt = 'Eres un experto en poesia y metrica espanola. Analiza esta estrofa completa:\n\n' + poem + '\n\nEl primer verso fue dado por el sistema. Los siguientes los escribio un jugador.\n\nHaz lo siguiente:\n1. Identifica la ultima palabra de cada verso y su terminacion desde la vocal tonica.\n2. Determina el esquema de rima (AABB, ABAB, ABBA, AAAA, libre, etc) asignando letras a cada verso.\n3. Valora del 1 al 10: rima (precision de las rimas), sentido (coherencia tematica), creatividad (originalidad), fluidez (ritmo y musicalidad).\n4. Escribe un comentario poetico breve valorando la estrofa en espanol.\n5. Calcula puntos de 0 a 1000: cada verso vale 60 puntos base, multiplicado por la calidad media de las 4 dimensiones dividida entre 10.\n\nResponde SOLO con JSON sin backticks ni texto extra:\n{"esquema":"ABAB","descripcion":"Rima cruzada","letras":["A","B","A","B","C","D","C","D"],"comentario":"valoracion poetica aqui","rima":8,"sentido":7,"creatividad":8,"fluidez":7,"puntos":420}';

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + process.env.GROQ_API_KEY
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                max_tokens: 400,
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
            console.error('Unexpected Groq response:', JSON.stringify(data));
            return res.status(500).json({ error: 'Unexpected response', detail: data.error || data });
        }

        const text = data.choices[0].message.content || '';
        const clean = text.replace(/```[a-z]*/g, '').replace(/```/g, '').trim();
        const result = JSON.parse(clean);
        return res.status(200).json(result);

    } catch (err) {
        console.error('Groq verse error:', err.message);
        return res.status(500).json({ error: err.message });
    }
}
