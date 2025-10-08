import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, X, Minimize2, Maximize2, Sparkles } from 'lucide-react';
import axios from 'axios';

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{type: 'user' | 'bot', content: string}>>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add initial recommendations message
      setMessages([{
        type: 'bot',
        content: `Welcome! Here are some important recommendations for optimal bot operation:

1. Browser and System Requirements:
   • Keep your browser window open (minimized is fine)
   • Ensure your computer's power settings prevent sleep mode
   • Use a dedicated device for trading operations
   • Consider using browser settings to prevent tab suspension

2. Network and Resources:
   • Maintain a stable internet connection
   • Monitor system resources to prevent throttling
   • Consider using a wired connection for better stability
   • Have a backup internet connection if possible

3. Best Practices:
   • Regularly backup your wallet configurations
   • Monitor your trading activities periodically
   • Keep track of your wallet balances
   • Review trading parameters regularly

4. Important Notes:
   • The bot continues running even when minimized
   • All data is stored locally in your browser
   • Clear browser data with caution to avoid losing settings
   • Consider using a dedicated browser profile

How can I assist you with your trading setup today?`
      }]);
    }
  }, [isOpen, messages.length]);

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessage = message.trim();
    setMessage('');
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant for the Falco-X Market to Market trading bot. You help users understand how the bot works and provide guidance on its features. The bot supports:
            - Multi-wallet management
            - Customizable buy/sell parameters
            - Token pair trading on Core blockchain
            - Automated trading cycles
            - Real-time balance tracking
            - Gas optimization
            - Slippage protection
            Keep responses concise, professional, and focused on helping users understand and use the bot effectively.`
          },
          {
            role: 'user',
            content: userMessage
          }
        ]
      }, {
        headers: {
          'Authorization': `Bearer sk-91d6c1d647f8422f8c54f14dc22d499f`,
          'Content-Type': 'application/json'
        }
      });

      const botResponse = response.data.choices[0].message.content;
      setMessages(prev => [...prev, { type: 'bot', content: botResponse }]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setMessages(prev => [...prev, { type: 'bot', content: 'I apologize, but I encountered an error. Please try again.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating chat button with animated glow effect */}
      <motion.div
        className="fixed lg:bottom-4 lg:right-4 md:bottom-4 md:right-4 sm:bottom-2 sm:right-2 bottom-2 right-2 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {!isOpen && (
          <motion.button
            className="relative btn bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-full p-4 shadow-lg overflow-hidden group"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
          >
            {/* Animated glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/50 via-purple-500/50 to-pink-500/50 blur-xl group-hover:opacity-75 transition-opacity opacity-0" />
            <Bot size={24} className="relative z-10 text-white" />
            <Sparkles size={12} className="absolute top-1 right-1 text-yellow-300 animate-pulse" />
          </motion.button>
        )}
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`fixed z-50 ${
              isMinimized
                ? 'lg:bottom-4 lg:right-4 lg:w-72 md:bottom-4 md:right-4 md:w-64 sm:bottom-2 sm:right-2 sm:w-56 bottom-2 right-2 w-[calc(100%-1rem)]'
                : 'lg:bottom-8 lg:right-8 lg:w-96 md:bottom-6 md:right-6 md:w-80 sm:bottom-4 sm:right-4 sm:w-72 bottom-2 right-2 w-[calc(100%-1rem)] max-w-lg'
            }`}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-slate-800/90 backdrop-blur-xl rounded-lg border border-slate-700/50 shadow-xl overflow-hidden">
              {/* Gradient header with animated background */}
              <div className="relative lg:p-4 md:p-3 p-2 border-b border-slate-700/50 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 animate-gradient-x" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Bot size={20} className="text-white" />
                    </motion.div>
                    <h3 className="font-semibold text-white lg:text-base md:text-sm text-sm">
                      Falco-X Assistant
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      className="text-white/80 hover:text-white transition-colors p-1"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIsMinimized(!isMinimized)}
                    >
                      {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                    </motion.button>
                    <motion.button
                      className="text-white/80 hover:text-white transition-colors p-1"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIsOpen(false)}
                    >
                      <X size={16} />
                    </motion.button>
                  </div>
                </div>
              </div>

              {!isMinimized && (
                <>
                  {/* Chat container with enhanced message styling */}
                  <div
                    ref={chatRef}
                    className="lg:p-4 md:p-3 p-2 lg:h-96 md:h-80 h-72 overflow-y-auto space-y-4 bg-slate-900/50"
                  >
                    {messages.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center text-gray-400 py-4 lg:text-base md:text-sm text-sm"
                      >
                        <Sparkles className="inline-block mb-2 text-yellow-400" size={24} />
                        <p>Hi! I'm here to help you understand how the Falco-X bot works.</p>
                        <p className="mt-2 text-indigo-400">Feel free to ask any questions!</p>
                      </motion.div>
                    )}
                    
                    {messages.map((msg, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg lg:p-3 md:p-2.5 p-2 lg:text-base md:text-sm text-sm ${
                            msg.type === 'user'
                              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                              : 'bg-slate-800/90 text-gray-100 border border-slate-700/50'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </motion.div>
                    ))}
                    
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                      >
                        <div className="bg-slate-800/90 text-gray-100 rounded-lg lg:p-3 md:p-2.5 p-2 border border-slate-700/50">
                          <div className="flex gap-2">
                            <motion.span
                              animate={{ y: [0, -5, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity }}
                              className="w-2 h-2 bg-indigo-500 rounded-full"
                            />
                            <motion.span
                              animate={{ y: [0, -5, 0] }}
                              transition={{ duration: 0.6, delay: 0.2, repeat: Infinity }}
                              className="w-2 h-2 bg-purple-500 rounded-full"
                            />
                            <motion.span
                              animate={{ y: [0, -5, 0] }}
                              transition={{ duration: 0.6, delay: 0.4, repeat: Infinity }}
                              className="w-2 h-2 bg-pink-500 rounded-full"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Enhanced input area with animations */}
                  <div className="lg:p-4 md:p-3 p-2 border-t border-slate-700/50 bg-slate-800/50">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 bg-slate-900/50 border border-slate-700/50 rounded-lg lg:px-4 md:px-3 px-2 lg:py-2 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 lg:text-base md:text-sm text-sm placeholder-gray-400"
                        placeholder="Ask me anything about the bot..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      />
                      <motion.button
                        className="btn bg-gradient-to-r from-indigo-600 to-purple-600 text-white lg:p-2 p-1.5 rounded-lg shadow-lg"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSend}
                      >
                        <Send size={20} />
                      </motion.button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistant;