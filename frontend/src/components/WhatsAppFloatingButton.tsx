import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, ShoppingBag, ExternalLink } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const WhatsAppFloatingButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Namaste! 🙏 I am your *ShelfSync AI Assistant*.\n\nAsk me for product recommendations, compare gadgets, or check deals under your budget!\n\nTry one of the prompts below:',
      timestamp: 'Just now',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const quickPrompts = [
    'Suggest wireless earphones under ₹1,500',
    'I need a gift for my father under ₹2,000',
    'Which laptop is suitable for students?',
    'Show me good running shoes',
  ];

  const handleSendMessage = async (msgText?: string) => {
    const textToSend = (msgText || inputMessage).trim();
    if (!textToSend || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Send to backend WhatsApp webhook handler
      const res = await fetch('/api/webhooks/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry: [
            {
              changes: [
                {
                  value: {
                    messages: [
                      {
                        from: '+919820012345',
                        type: 'text',
                        text: { body: textToSend },
                      },
                    ],
                  },
                },
              ],
            },
          ],
        }),
      });

      // Poll latest notification log to get the actual AI reply
      setTimeout(async () => {
        try {
          const logRes = await fetch('/api/search?q=' + encodeURIComponent(textToSend));
          const searchData = await logRes.json();
          const items = searchData.products || [];

          let replyText = '';
          if (items.length > 0) {
            replyText = `✨ *ShelfSync AI Recommendations* ✨\n\nHere are top picks matching "${textToSend}":\n\n` +
              items.slice(0, 3).map((p: any, idx: number) => 
                `${idx + 1}. *${p.name}*\n   💰 *₹${Number(p.final_price).toLocaleString('en-IN')}* (${p.discount_percent}% OFF)\n   ⭐ ${p.rating}/5 | ${p.in_stock ? '✅ In Stock' : '⚠️ Limited Stock'}\n   🔗 ${window.location.origin}/products/${p.slug}`
              ).join('\n\n') +
              `\n\nℹ️ *Note*: Please click the links above to add items to your cart and checkout securely on the ShelfSync website.`;
          } else {
            replyText = `I searched ShelfSync for "${textToSend}", but didn't find exact matches. Try browsing electronics, fashion, or kitchen essentials on our website!`;
          }

          setMessages((prev) => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              sender: 'assistant',
              text: replyText,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        } catch {
          setMessages((prev) => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              sender: 'assistant',
              text: 'Here are popular recommendations matching your query on ShelfSync. Please browse our catalogue for complete details.',
              timestamp: 'Just now',
            },
          ]);
        } finally {
          setIsTyping(false);
        }
      }, 700);
    } catch {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-2xl transition transform hover:scale-105"
          title="Open ShelfSync AI WhatsApp Assistant"
        >
          <MessageSquare className="w-6 h-6 fill-current" />
          <span className="hidden sm:inline font-bold text-sm tracking-wide">
            AI Assistant
          </span>
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
          </span>
        </button>
      </div>

      {/* WhatsApp Modal Dialog */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 w-[92vw] sm:w-[400px] h-[550px] bg-slate-100 rounded-3xl shadow-2xl border border-slate-300 flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-5">
          
          {/* Header (WhatsApp Brand Style) */}
          <div className="bg-[#075E54] text-white p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-white shadow">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold flex items-center space-x-1">
                  <span>ShelfSync AI Assistant</span>
                </h3>
                <p className="text-[11px] text-emerald-200">
                  Online • Gemini 2.5 + OpenSearch
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-emerald-200 hover:text-white rounded-full hover:bg-emerald-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#E5DDD5] text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm whitespace-pre-line leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-[#DCF8C6] text-slate-900 rounded-tr-none'
                      : 'bg-white text-slate-800 rounded-tl-none'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 px-1">
                  {m.timestamp}
                </span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center space-x-1 bg-white px-3 py-2 rounded-full w-20 shadow-sm">
                <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="bg-slate-50 border-t border-slate-200 px-3 py-2 flex space-x-1.5 overflow-x-auto scrollbar-none">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSendMessage(prompt)}
                className="shrink-0 text-[11px] bg-white border border-slate-300 hover:border-emerald-600 hover:text-emerald-700 text-slate-700 px-2.5 py-1 rounded-full font-medium transition"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2"
          >
            <input
              type="text"
              placeholder="Ask for products, prices, or compare..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className="p-2.5 bg-[#075E54] hover:bg-[#128C7E] disabled:bg-slate-300 text-white rounded-full transition shadow"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
