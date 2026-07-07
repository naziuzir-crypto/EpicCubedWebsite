import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    // הגדרת הרשאות כדי שנוכל לשלוח מידע בבטחה
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'POST') {
            const { name, time } = req.body;
            if (!name || time === undefined) {
                return res.status(400).json({ error: 'Missing data' });
            }

            // שומרים את השיא החדש ברשימה של מסד הנתונים
            await kv.zadd('leaderboard', { score: time, member: `${name}_${Date.now()}` });
            return res.status(200).json({ success: true });
        } 
        
        if (req.method === 'GET') {
            // מושכים את 5 השיאים הכי טובים (הזמן הכי נמוך)
            const rawScores = await kv.zrange('leaderboard', 0, 4, { withScores: true });
            const formatted = [];
            
            for (let i = 0; i < rawScores.length; i += 2) {
                // מנקים את ה-ID הייחודי מהשם
                const cleanName = rawScores[i].split('_')[0];
                formatted.push({ name: cleanName, time: Number(rawScores[i + 1]) });
            }
            
            return res.status(200).json(formatted);
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
