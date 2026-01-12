import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(express.json());

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

app.post("/ask", async(req, res) => {
    const{ question } = req.body;

    if (!question) {
        return res.status(400).json({ error: "question is required" });
    }

    const response  = await client.chat.completions.create({
        model : "gpt-4o-mini",
        messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: question }
        ],
        temperature: 0.3
    });

    res.json({
        answer: response.choices[0].message.content
    });
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
})