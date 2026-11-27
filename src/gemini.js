// src/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

// Fastest models first
const MODELS_TO_TRY = [
  "gemini-3.5-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-3.5-flash",
];

async function generateWithFallback(prompt) {
  let lastError = null;
  for (const modelName of MODELS_TO_TRY) {
    try {
      const model = genAI.getGenerativeModel(
        { model: modelName },
        { timeout: 7000 }
      );
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (err) {
      console.warn(`Model ${modelName} slow or failed, falling back:`, err.message || err);
      lastError = err;
    }
  }
  throw lastError;
}

/**
 * Parse a natural-language activity message into structured data.
 * Returns { subject, activity, date, time, reply }
 */
export async function parseActivityMessage(userMessage, currentDateTime) {
  const prompt = `
You are a personal activity tracker assistant. The user will tell you what they did in plain English.
Your job is to extract structured activity data and return a friendly confirmation.

CRITICAL EXTRACTION REQUIREMENTS:
1. "activity": Extract ONLY crisp action KEYWORDS (2 to 5 words max). For example: "Completed EL Project", "Solved BST Problems", "Physics Lab Simulation", "Maths Assignment 3".
   - DO NOT write full sentences or narrative paragraphs.
   - DO NOT include conversational filler like "I was working on", "I completed", "today at 4pm".
   - Keep it strictly concise keywords.
2. "subject": Core domain, subject, or course name (e.g. "EL", "DSA", "Maths", "Physics", "General").
3. "date": Date in "YYYY-MM-DD" format (use current date if not mentioned).
4. "time": Time in 24hr "HH:MM" format (e.g. "16:00", "09:30" - use current time if not mentioned).
5. "reply": A friendly 1-sentence confirmation highlighting the keywords logged with date and time.

Current date and time: ${currentDateTime}

User's message: "${userMessage}"

Respond ONLY with a valid JSON object in this exact format (no markdown, no code block, just raw JSON):
{
  "subject": "Core Subject",
  "activity": "Crisp Action Keywords (2-5 words)",
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "reply": "friendly 1-sentence confirmation"
}

If the message is NOT an activity log (e.g. it is a general question or greeting), set subject and activity to empty strings and put a helpful response in reply.
`;

  const text = await generateWithFallback(prompt);

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

  return await generateWithFallback(prompt);
}

