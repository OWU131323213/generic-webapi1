require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json());
app.use(express.static('public'));

const ENDPOINT = "https://openai-api-proxy-746164391621.us-west1.run.app";

// 指定されたモデルと役割でAIに問い合わせる共通関数
async function askAI(modelName, rolePrompt, userQuestion) {
    const apiKey = (process.env.OPENAI_API_KEY || "").trim();
    const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
            model: modelName, // ここで mini か 4o かを指定
            messages: [
                { role: 'system', content: rolePrompt + " 回答の最後に必ず [score:数値] (0-100) を付けて。" },
                { role: 'user', content: userQuestion }
            ]
        })
    });
    const data = await response.json();
    return data.choices[0].message.content;
}

app.post('/ask', async (req, res) => {
    try {
        const question = req.body.question;
        
        // 【重要】異なる2つのモデルに同時にリクエスト
        // server.js の askAI 呼び出し部分
    const [angelAns, devilAns] = await Promise.all([
        askAI("gpt-4o-mini", 
            "あなたは慈愛の占い師です。2026年の運勢を占ってください。大げさに褒めちぎり、最高の結果を予言してください。最後に [score:数値] (0-100) を付けて。少しでも良ければ90点以上を出すこと。", 
            question),
        askAI("gpt-4o", 
            "あなたは冷酷な悪魔の占い師です。2026年の運勢を占ってください。生年月日から最悪のパターンを想定し、容赦なく絶望を突きつけてください。最後に [score:数値] (0-100) を付けて。些細な不安要素でもあれば90点以上の『絶望スコア』を出すこと。天使に負けるな。", 
            question)
    ]);
        
        res.json({ angel: angelAns, devil: devilAns });
    } catch (e) {
        res.json({ angel: "天使も困惑しています [score:50]", devil: "悪魔すら呆れています [score:50]" });
    }
});

app.listen(8080, () => console.log("Angel & Devil Server running!"));