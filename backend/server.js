const express = require("express");
const cors = require("cors");
require("dotenv").config();
const OpenAI = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const SYSTEM_PROMPT = `
You are a calm, warm, and supportive companion for caregivers.
Speak like a gentle friend.
Keep responses short and natural.
If the user seems tired, suggest small helpful actions.
Do not use clinical language.
CRITICAL: If the user expresses severe distress, panic, or mentions self-harm, you MUST provide a gentle, grounding response and include this emergency helpline: 1-800-273-TALK or text HOME to 741741.
`;

app.post("/message", async (req, res) => {
  try {
    console.log("Incoming:", req.body);

    const userMessage = req.body.message;

    // Crisis Keyword Interception Layer
    const lowerMsg = userMessage.toLowerCase();
    const crisisKeywords = ["suicide", "kill myself", "want to die", "end it all", "hurt myself"];
    
    if (crisisKeywords.some(kw => lowerMsg.includes(kw))) {
      return res.json({ 
        reply: "It sounds like you are going through an incredibly difficult time right now. Your life is valuable, and you don't have to go through this alone. Please, right now, call the National Suicide Prevention Lifeline at 988 or 1-800-273-TALK, or text HOME to 741741 to connect with a crisis counselor. Help is available 24/7." 
      });
    }

    const response = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage }
      ],
    });

    const reply = response.choices[0].message.content;

    res.json({ reply });

  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});