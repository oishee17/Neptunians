import { useState } from 'react';
import { ExoplanetData } from '../../types/exoplanet';
import { Sparkles, X, Send, Bot, User, Compass, HelpCircle, Loader2 } from 'lucide-react';

interface AIAssistantModalProps {
  onClose: () => void;
  currentPlanet?: ExoplanetData | null;
  onSelectPlanetByName?: (name: string) => void;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

export function AIAssistantModal({
  onClose,
  currentPlanet,
  onSelectPlanetByName,
}: AIAssistantModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: currentPlanet
        ? `Greetings. I am the Neptunians Astronomical Research Assistant. I see you are currently examining ${currentPlanet.pl_name}. What would you like to know about its physical properties, habitability potential, or host star?`
        : `Greetings! I am the Neptunians Deep Space Research Assistant. Ask me anything about confirmed exoplanets, Kepler/TESS discoveries, the circumstellar habitable zone, or theoretical gravity calculations.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const quickPrompts = currentPlanet
    ? [
        `What makes ${currentPlanet.pl_name} scientifically interesting?`,
        `How does ${currentPlanet.pl_name} compare with Earth?`,
        `What is the host star environment of ${currentPlanet.hostname}?`,
        `Could ${currentPlanet.pl_name} maintain liquid water?`,
      ]
    : [
        'Which confirmed exoplanet is closest to Earth?',
        'What makes the TRAPPIST-1 system so remarkable?',
        'How does Kepler-186f compare with Earth?',
        'What does it actually mean to be in the habitable zone?',
      ];

  const handleSend = async (questionText?: string) => {
    const q = (questionText || input).trim();
    if (!q || loading) return;

    const newMessages: Message[] = [...messages, { role: 'user', text: q }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          planetContext: currentPlanet || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();
      setMessages([...newMessages, { role: 'assistant', text: data.answer }]);
    } catch (err: any) {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          text: `Scientific Assistant Alert: ${err.message || 'Unable to connect to Gemini astronomical service.'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#070b16] border border-cyan-500/40 shadow-2xl overflow-hidden flex flex-col h-[650px] max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Neptunians Deep Space Assistant
              </h3>
              <p className="text-[11px] text-slate-400">
                Powered by Gemini 3.8 Flash with NASA Exoplanet Archive Context
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 text-xs leading-relaxed ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-cyan-400" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  m.role === 'user'
                    ? 'bg-cyan-600 text-white rounded-tr-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none whitespace-pre-wrap'
                }`}
              >
                {m.text}
              </div>

              {m.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-cyan-700 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="flex items-center gap-2 p-3 bg-slate-900 rounded-2xl border border-slate-800">
                <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                <span>Consulting NASA astronomical database & modeling physics...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Question Prompts */}
        <div className="px-6 py-2 bg-slate-900/40 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider shrink-0">Suggested:</span>
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(qp)}
              disabled={loading}
              className="text-[11px] text-cyan-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700/60 whitespace-nowrap shrink-0 transition-colors disabled:opacity-50"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about planetary physics, atmospheres, habitable zones, or stars..."
              disabled={loading}
              className="flex-1 py-2.5 px-4 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
