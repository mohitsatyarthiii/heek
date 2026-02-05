"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  Zap,
  Brain,
  Mic,
  MicOff,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Loader2,
  ChevronUp,
  ChevronDown,
  Star,
  Menu,
  Volume2,
  VolumeX,
  Moon,
  Sun,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = "https://api.openai.com/v1/chat/completions";

const INITIAL_MESSAGES = [
  {
    id: 1,
    role: "assistant",
    content: "Hi! I'm Ria, your AI assistant. I can help you with campaigns, creators, tasks, and payments. What would you like to know? 😊",
    timestamp: new Date().toISOString(),
  },
];

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(20);
  const [showMenu, setShowMenu] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load saved conversation
  useEffect(() => {
    const saved = localStorage.getItem('ria_conversation');
    if (saved) {
      setMessages(JSON.parse(saved));
    }
  }, []);

  // Save conversation
  useEffect(() => {
    if (messages.length > 1) {
      localStorage.setItem('ria_conversation', JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [messages, isTyping]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 400);
    }
  }, [isOpen]);

  // Typewriter effect
  const simulateTyping = (text, onComplete) => {
    setIsTyping(true);
    setTypingText("");
    let index = 0;
    
    const typeChar = () => {
      if (index < text.length) {
        setTypingText(prev => prev + text.charAt(index));
        index++;
        typingTimeoutRef.current = setTimeout(typeChar, typingSpeed);
      } else {
        setIsTyping(false);
        if (onComplete) onComplete();
      }
    };
    
    typeChar();
  };

  // Send message to AI
  const sendToAI = async (userMessage) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          history: messages.slice(-6).map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }),
      });

      if (!response.ok) throw new Error('API error');
      
      const data = await response.json();
      return data.reply;
      
    } catch (error) {
      console.error('AI Error:', error);
      return "I'm having trouble connecting right now. Please check your internet connection and try again. In the meantime, you can ask about:\n\n• Campaign strategies\n• Creator management\n• Task prioritization\n• Payment tracking";
    }
  };

  const handleSendMessage = async () => {
    const text = inputMessage.trim();
    if (!text || isLoading || isTyping) return;

    // Add user message
    const userMsg = {
      id: Date.now(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    // Get AI response
    const aiResponse = await sendToAI(text);
    
    // Simulate typing
    simulateTyping(aiResponse, () => {
      const aiMsg = {
        id: Date.now() + 1,
        role: "assistant",
        content: aiResponse,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, aiMsg]);
      setIsLoading(false);
      
      // Play notification sound if not muted
      if (!isMuted) {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {});
      }
    });
  };

  // Quick actions
  const quickActions = [
    {
      icon: "📊",
      label: "Campaign Analytics",
      prompt: "Show me campaign analytics and ROI metrics"
    },
    {
      icon: "👥",
      label: "Creator Match",
      prompt: "Find the best creators for my beauty campaign"
    },
    {
      icon: "💰",
      label: "Payment Status",
      prompt: "Check pending payments and invoices"
    },
    {
      icon: "📋",
      label: "Task List",
      prompt: "Show me today's priority tasks"
    },
  ];

  // Voice recording
  const startRecording = () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Voice recording not supported in your browser");
      return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          
          // Here you would send the audio to a speech-to-text API
          // For demo, we'll just show a placeholder
          setInputMessage("Voice message transcribed: [Audio processing would happen here]");
        };

        mediaRecorder.start();
        setIsRecording(true);
      })
      .catch(err => {
        console.error("Mic error:", err);
        alert("Could not access microphone");
      });
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleVoiceToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const clearChat = () => {
    setMessages(INITIAL_MESSAGES);
    localStorage.removeItem('ria_conversation');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format time
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <>
      {/* Floating Button */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="fixed bottom-4 right-4 z-50 md:bottom-6 md:right-6"
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={`h-14 w-14 rounded-full shadow-2xl ${
            isOpen 
              ? 'bg-gradient-to-br from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700' 
              : 'bg-gradient-to-br from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800'
          }`}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90 }}
                animate={{ rotate: 0 }}
                exit={{ rotate: 90 }}
              >
                <X className="h-6 w-6" />
              </motion.div>
            ) : (
              <motion.div
                key="icon"
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  rotate: { repeat: Infinity, duration: 4 },
                  scale: { repeat: Infinity, duration: 2 }
                }}
              >
                <Brain className="h-6 w-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
        
        {messages.length > 2 && !isOpen && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-green-500 border-2 border-background p-0 flex items-center justify-center animate-pulse">
            <span className="text-[10px]">{messages.length - 1}</span>
          </Badge>
        )}
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`fixed inset-4 md:inset-auto md:bottom-24 md:right-6 z-50 ${
              isMobile 
                ? 'top-4 left-4 right-4 bottom-4' 
                : 'md:w-[400px] md:h-[600px]'
            } flex flex-col bg-card rounded-2xl shadow-2xl border border-border overflow-hidden`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Brain className="h-6 w-6" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 border-2 border-purple-700 flex items-center justify-center">
                      <Star className="h-2.5 w-2.5 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="font-bold text-xl flex items-center gap-2">
                      Ria AI
                      <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Pro
                      </Badge>
                    </h2>
                    <p className="text-white/90 text-sm flex items-center">
                      <span className={`h-2 w-2 rounded-full mr-2 ${isTyping ? 'bg-green-400 animate-pulse' : 'bg-white/60'}`} />
                      {isTyping ? "Typing..." : "Online • Ready to help"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMuted(!isMuted)}
                    className="h-8 w-8 text-white hover:bg-white/20"
                  >
                    {isMuted ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowMenu(!showMenu)}
                    className="h-8 w-8 text-white hover:bg-white/20"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            {!isLoading && !isTyping && messages.length <= 2 && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 border-b border-border"
              >
                <p className="text-sm text-muted-foreground mb-2 px-2">Try asking:</p>
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setInputMessage(action.prompt);
                        inputRef.current?.focus();
                      }}
                      className="h-8 text-xs rounded-full"
                    >
                      <span className="mr-1">{action.icon}</span>
                      {action.label}
                    </Button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Menu Dropdown */}
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-2 top-16 z-10 w-48 bg-popover rounded-lg shadow-lg border border-border"
                >
                  <div className="p-2 space-y-1">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm"
                      onClick={() => {
                        setTypingSpeed(prev => prev === 20 ? 5 : 20);
                        setShowMenu(false);
                      }}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      {typingSpeed === 20 ? "Fast Typing" : "Normal Typing"}
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm"
                      onClick={() => {
                        setIsDarkMode(!isDarkMode);
                        setShowMenu(false);
                      }}
                    >
                      {isDarkMode ? (
                        <Sun className="h-4 w-4 mr-2" />
                      ) : (
                        <Moon className="h-4 w-4 mr-2" />
                      )}
                      {isDarkMode ? "Light Mode" : "Dark Mode"}
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm"
                      onClick={() => {
                        clearChat();
                        setShowMenu(false);
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Clear Chat
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm text-red-500 hover:text-red-600"
                      onClick={() => {
                        setIsOpen(false);
                        setShowMenu(false);
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Close Chat
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages Area */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea 
                ref={scrollAreaRef}
                className="h-full p-4"
              >
                <div className="space-y-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] ${message.role === 'user' ? 'ml-auto' : ''}`}>
                        <div className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                          <Avatar className={`h-8 w-8 ${message.role === 'user' ? 'bg-primary' : 'bg-gradient-to-br from-violet-500 to-purple-600'}`}>
                            {message.role === 'user' ? (
                              <User className="h-4 w-4" />
                            ) : (
                              <Bot className="h-4 w-4" />
                            )}
                          </Avatar>
                          
                          <div className="flex flex-col">
                            <div
                              className={`rounded-2xl px-4 py-3 ${
                                message.role === 'user'
                                  ? 'bg-primary text-primary-foreground rounded-br-none'
                                  : 'bg-muted text-foreground rounded-bl-none'
                              }`}
                            >
                              <div className="text-sm whitespace-pre-wrap leading-relaxed">
                                {message.content}
                              </div>
                            </div>
                            <div className={`text-xs mt-1 px-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                              <span className="text-muted-foreground">
                                {formatTime(message.timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex justify-start"
                    >
                      <div className="flex gap-2 max-w-[85%]">
                        <Avatar className="h-8 w-8 bg-gradient-to-br from-violet-500 to-purple-600">
                          <Bot className="h-4 w-4 text-white" />
                        </Avatar>
                        <div className="bg-muted rounded-2xl rounded-bl-none px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              {[0, 1, 2].map((i) => (
                                <motion.div
                                  key={i}
                                  animate={{ y: [0, -4, 0] }}
                                  transition={{ 
                                    repeat: Infinity, 
                                    duration: 0.6,
                                    delay: i * 0.1
                                  }}
                                  className="h-2 w-2 rounded-full bg-purple-500"
                                />
                              ))}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              Ria is thinking...
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </div>

            {/* Input Area */}
            <div className="border-t border-border p-3 bg-background/50 backdrop-blur-sm">
              <div className="relative">
                <Input
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={isLoading || isTyping}
                  className="pr-24 h-12 rounded-full border-2 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleVoiceToggle}
                    disabled={isLoading || isTyping}
                    className={`h-9 w-9 rounded-full ${isRecording ? 'bg-red-100 text-red-600 animate-pulse' : ''}`}
                  >
                    {isRecording ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading || isTyping}
                    className="h-10 w-10 rounded-full bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800"
                  >
                    {isLoading || isTyping ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Footer Stats */}
              <div className="flex items-center justify-between mt-3 px-2">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Smart Assistant
                  </span>
                  <span>•</span>
                  <span>
                    {messages.length} messages
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => alert("Thanks for your feedback! 👍")}
                  >
                    <ThumbsUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      const feedback = prompt("What can I improve?");
                      if (feedback) alert("Thanks for helping me improve! 💜");
                    }}
                  >
                    <ThumbsDown className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}