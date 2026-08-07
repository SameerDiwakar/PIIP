import { useEffect, useState, useRef } from 'react';
import API from '../api';
import { Send, MessageSquare, Sparkles, User } from 'lucide-react';

const FormattedMessage = ({ content, isUser }) => {
  if (!content) return null;

  const lines = content.split('\n');

  return (
    <div className={`space-y-1.5 leading-relaxed text-sm ${isUser ? 'text-white' : 'text-slate-700'}`}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Header lines starting with ### or ## or #
        if (trimmed.startsWith('#')) {
          const text = trimmed.replace(/^#+\s*/, '');
          return (
            <h4 key={idx} className={`font-bold mt-2 mb-1 ${isUser ? 'text-white' : 'text-slate-900'}`}>
              {renderInline(text, isUser)}
            </h4>
          );
        }

        // Bullet points starting with • or - or *
        if (/^[•\-\*]\s+/.test(trimmed)) {
          const text = trimmed.replace(/^[•\-\*]\s+/, '');
          return (
            <div key={idx} className="flex gap-2 pl-1 my-1">
              <span className={`font-bold ${isUser ? 'text-white/80' : 'text-primary-600'}`}>•</span>
              <div>{renderInline(text, isUser)}</div>
            </div>
          );
        }

        // Numbered list items starting with 1. 2. etc.
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex gap-2 pl-1 my-1">
              <span className={`font-bold shrink-0 ${isUser ? 'text-white/90' : 'text-primary-600'}`}>{numMatch[1]}.</span>
              <div>{renderInline(numMatch[2], isUser)}</div>
            </div>
          );
        }

        // Normal text line
        return <p key={idx}>{renderInline(trimmed, isUser)}</p>;
      })}
    </div>
  );
};

const renderInline = (text, isUser) => {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={i} className={`font-semibold ${isUser ? 'text-white' : 'text-slate-900'}`}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={i} className="italic opacity-90">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
};

const AIChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    API.get('/ai/chat/history').then((res) => {
      setHistory(res.data.messages || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await API.post('/ai/chat', { message: userMessage.content });
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.content }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = [
    'Analyze my trading patterns',
    'What\'s my behavioral profile?',
    'How can I improve my discipline?',
    'What sectors do I prefer?',
  ];

  return (
    <div className="space-y-6 animate-fade-in h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] flex flex-col">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">AI Assistant</h1>
        <p className="text-slate-500 mt-1">Get personalized insights about your investing behavior</p>
      </div>

      <div className="card flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.length === 0 && history.length === 0 && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 text-primary-600 mb-4">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Ask me anything about your investments</h3>
              <p className="text-sm text-slate-500 mb-6">I can analyze your behavior, suggest improvements, and answer investment questions.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md mx-auto">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => setInput(s)} className="text-left p-3 rounded-lg border border-slate-200 hover:border-primary-300 hover:bg-primary-50 text-sm text-slate-700 transition-all">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {history.length > 0 && messages.length === 0 && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-3">Recent History</div>
              {history.slice(-10).map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 text-slate-600'}`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                  </div>
                  <div className={`max-w-[80%] md:max-w-[75%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                    <FormattedMessage content={msg.content} isUser={msg.role === 'user'} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 text-slate-600'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
              </div>
              <div className={`max-w-[80%] md:max-w-[75%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                <FormattedMessage content={msg.content} isUser={msg.role === 'user'} />
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"><MessageSquare className="w-4 h-4" /></div>
              <div className="bg-slate-100 rounded-2xl px-4 py-3 text-sm text-slate-500">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-slate-200 p-4">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your investing behavior..."
              className="input flex-1"
              disabled={loading}
            />
            <button onClick={handleSend} disabled={loading || !input.trim()} className="btn-primary px-4">
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">AI responses are educational, not financial advice.</p>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
