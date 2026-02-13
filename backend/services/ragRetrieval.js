/**
 * RAG Retrieval Service
 *
 * Lightweight retrieval-augmented generation using Mongo's built-in
 * text index on WorkspaceFile.  Searches file names, descriptions,
 * tags and extracted text and returns the top relevant snippets so
 * they can be injected into the AI assistant's system prompt.
 *
 * No external vector DB or embeddings needed — works out of the box
 * with the free Groq API + MongoDB Atlas / local Mongo.
 */

const WorkspaceFile = require('../models/WorkspaceFile');

const MAX_SNIPPET_LENGTH = 1500; // chars per snippet
const MAX_SNIPPETS = 5;

/**
 * Search workspace files for text relevant to `query`.
 * Uses the Mongo $text index first; falls back to regex if
 * no text index exists yet (dev convenience).
 */
const retrieveContext = async (workspaceId, query) => {
  if (!query || !workspaceId) return [];

  try {
    // ---- Primary: Mongo full-text search ----
    let files = await WorkspaceFile.find(
      {
        workspace: workspaceId,
        status: 'active',
        $text: { $search: query }
      },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(MAX_SNIPPETS)
      .select('originalName description tags extractedText score')
      .lean();

    // ---- Fallback: regex search when text index returns nothing ----
    if (files.length === 0) {
      const regex = new RegExp(
        query.split(/\s+/).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
        'i'
      );
      files = await WorkspaceFile.find({
        workspace: workspaceId,
        status: 'active',
        $or: [
          { originalName: regex },
          { description: regex },
          { tags: regex },
          { extractedText: regex }
        ]
      })
        .limit(MAX_SNIPPETS)
        .select('originalName description tags extractedText')
        .lean();
    }

    // Build snippets
    return files.map(f => {
      let snippet = `[File: ${f.originalName}]`;
      if (f.description) snippet += `\nDescription: ${f.description}`;
      if (f.tags?.length) snippet += `\nTags: ${f.tags.join(', ')}`;
      if (f.extractedText) {
        const trimmed =
          f.extractedText.length > MAX_SNIPPET_LENGTH
            ? f.extractedText.substring(0, MAX_SNIPPET_LENGTH) + '…'
            : f.extractedText;
        snippet += `\nContent:\n${trimmed}`;
      }
      return snippet;
    });
  } catch (err) {
    // If the text index hasn't been created yet, just return empty
    console.warn('⚠️ RAG retrieval error (non-blocking):', err.message);
    return [];
  }
};

/**
 * Format retrieved snippets into a single string that can be
 * injected into the AI system prompt.
 */
const formatSnippetsForPrompt = (snippets) => {
  if (!snippets || snippets.length === 0) return '';
  return `\n\nRELEVANT WORKSPACE FILES (for answering the user's question):\n${snippets.join('\n---\n')}\n`;
};

module.exports = { retrieveContext, formatSnippetsForPrompt };
