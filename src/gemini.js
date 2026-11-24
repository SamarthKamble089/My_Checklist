// src/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

/**
 * Parse a natural-language activity message into structured data.
 * Returns { subject, activity, date, time, reply }
 */
export async function parseActivityMessage(userMessage, currentDateTime) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
You are a personal activity tracker assistant. The user will tell you what they did today in plain English.
Your job is to:
1. Extract structured data from their message
2. Give a friendly short confirmation reply

Current date and time: ${currentDateTime}

User's message: "${userMessage}"

Respond ONLY with a valid JSON object in this exact format (no markdown, no code block, just raw JSON):
{
  "subject": "the subject/project name (e.g. EL, DSA, Maths, Physics Lab)",
  "activity": "a concise description of what they did",
  "date": "YYYY-MM-DD (use current date if not mentioned)",
  "time": "HH:MM in 24hr format (use current time if not mentioned)",
  "reply": "a friendly 1-sentence confirmation to show the user in chat"
}

If the message is NOT an activity log (e.g. it's a question or greeting), set subject and activity to empty strings and put a helpful response in reply.
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  try {
    // Strip markdown code fences if model wraps it anyway
    const clean = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    return JSON.parse(clean);
  } catch {
    return {
      subject: "",
      activity: "",
      date: "",
      time: "",
      reply: text,
    };
  }
}

/**
 * Answer a question about the user's activity log.
 */
export async function answerAboutLog(userMessage, entries, currentDateTime) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const logSummary = entries
    .map(
      (e) =>
        `[${e.date} ${e.time}] Subject: ${e.subject} | Activity: ${e.activity}`
    )
    .join("\n");

  const prompt = `
You are a personal activity tracker assistant. The user is asking a question about their activity log.
Current date and time: ${currentDateTime}

Their activity log:
${logSummary || "(no entries yet)"}

User's question: "${userMessage}"

Give a helpful, concise answer based on their log.
`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
