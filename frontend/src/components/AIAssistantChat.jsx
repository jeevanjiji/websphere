import React, { useState, useRef, useEffect } from 'react';
import {
  PaperAirplaneIcon,
  SparklesIcon,
  ArrowPathIcon,
  LightBulbIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

/**
 * AIAssistantChat — workspace-embedded chatbot.
 *
 * Props:
 *   workspaceId  – the active workspace's Mongo _id
 *   user         – current logged-in user (needs .role / .userType)
 *
 * Uses the backend route:  POST /api/workspace/:workspaceId/ask-ai
 */
const AIAssistantChat = ({ workspaceId, user }) => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "👋  Hi! I'm your **WebSphere AI Assistant** powered by Llama 3.3.\n\nI know everything about this workspace — milestones, deliverables, payments, uploaded files, and chat history.\n\nAsk me anything, or try the quick actions below!",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Quick-action buttons ── */
  const quickActions = [
    { label: 'Project Overview', icon: ChartBarIcon, endpoint: 'overview' },
    { label: 'Next Steps', icon: LightBulbIcon, endpoint: 'next-steps' },
  ];

  /* ── Send a free-form question ── */
  const handleSend = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/workspace/${workspaceId}/ask-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply || data.message || 'Sorry, I could not generate a response.',
          timestamp: data.timestamp || new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error('AI chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '⚠️ Something went wrong. Please check your connection and try again.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  /* ── Quick-action handler ── */
  const handleQuickAction = async (action) => {
    if (loading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: `📌 ${action.label}`,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/workspace/${workspaceId}/ask-ai/${action.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply || 'No response received.',
          timestamp: data.timestamp || new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error('Quick action error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '⚠️ Failed to fetch. Please try again.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /* ── Render markdown-ish text with basic formatting ── */
  const renderContent = (text) => {
    // Bold
    let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Bullet lists (lines starting with - or •)
    html = html.replace(/^[-•]\s+(.*)$/gm, '<li class="ml-4 list-disc">$1</li>');
    // Numbered lists
    html = html.replace(/^\d+\.\s+(.*)$/gm, '<li class="ml-4 list-decimal">$1</li>');
    // Wrap consecutive <li> in <ul>
    html = html.replace(/((?:<li[^>]*>.*?<\/li>\s*)+)/g, '<ul class="space-y-1 my-1">$1</ul>');
    // Line breaks
    html = html.replace(/\n/g, '<br/>');
    return html;
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-white/80 backdrop-blur">
        <SparklesIcon className="h-5 w-5 text-purple-600" />
        <h3 className="font-semibold text-gray-800">AI Assistant</h3>
        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
          Llama 3.3 + RAG
        </span>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 px-4 py-2 border-b bg-white/60 overflow-x-auto">
        {quickActions.map((qa) => (
          <button
            key={qa.endpoint}
            onClick={() => handleQuickAction(qa)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full
                       border border-purple-200 text-purple-700 bg-white
                       hover:bg-purple-50 disabled:opacity-50 transition whitespace-nowrap"
          >
            <qa.icon className="h-3.5 w-3.5" />
            {qa.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white rounded-br-sm'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div
                  className="ai-response prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }}
                />
              ) : (
                <p>{msg.content}</p>
              )}
              <div
                className={`text-[10px] mt-1 ${
                  msg.role === 'user' ? 'text-purple-200' : 'text-gray-400'
                }`}
              >
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm flex items-center gap-2">
              <ArrowPathIcon className="h-4 w-4 text-purple-500 animate-spin" />
              <span className="text-sm text-gray-500">Thinking…</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t bg-white">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this project…"
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg
                       focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                       disabled:bg-gray-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg
                       hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors flex items-center gap-1.5 text-sm font-medium"
          >
            <PaperAirplaneIcon className="h-4 w-4" />
            Send
          </button>
        </form>
        <p className="text-[10px] text-gray-400 mt-1.5 text-center">
          Powered by Llama 3.3 via Groq · Answers based on workspace data &amp; uploaded files
        </p>
      </div>
    </div>
  );
};

export default AIAssistantChat;
