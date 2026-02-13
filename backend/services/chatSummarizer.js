/**
 * Chat Summarizer Service
 *
 * Uses Groq (free hosted Llama) to summarize long client messages
 * into a short summary + actionable items for the freelancer.
 */

const Groq = require('groq-sdk');

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

const LONG_MESSAGE_THRESHOLD = 300; // characters

/**
 * Determine whether a message is long enough to warrant a summary.
 */
const shouldSummarize = (content) => {
  if (!content) return false;
  return content.length >= LONG_MESSAGE_THRESHOLD;
};

/**
 * Call Groq to summarize a client message.
 * Returns { summary, actionItems } or null on failure.
 */
const summarizeMessage = async (content, projectTitle = '') => {
  try {
    if (!groq) {
      console.warn('⚠️ GROQ_API_KEY missing – skipping summarization');
      return null;
    }

    const systemPrompt = `You are a concise project-management assistant.
A client has written a long message to a freelancer about a project${projectTitle ? ` called "${projectTitle}"` : ''}.

Your job:
1. Write a SHORT summary (2-3 sentences max).
2. Extract a list of specific, actionable items the freelancer must do.

Reply ONLY with valid JSON – no markdown, no code fences:
{
  "summary": "...",
  "actionItems": ["item 1", "item 2"]
}`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content }
      ],
      temperature: 0.3,
      max_tokens: 512,
      stream: false
    });

    const raw = completion.choices[0]?.message?.content || '';

    // Try to parse JSON (the model might wrap it in backticks)
    const jsonStr = raw.replace(/```json?\s*/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    return {
      summary: parsed.summary || null,
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : []
    };
  } catch (err) {
    console.error('⚠️ Chat summarization failed (non-blocking):', err.message);
    return null;
  }
};

module.exports = { shouldSummarize, summarizeMessage };
