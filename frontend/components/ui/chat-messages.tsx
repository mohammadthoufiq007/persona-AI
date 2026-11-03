"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, RotateCcw, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  sender?: "user" | "assistant";
  role?: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export interface ChatMessagesProps {
  messages?: ChatMessage[];
  autoPlay?: boolean;
  autoPlayDelay?: number;
  typingDuration?: number;
  showReplay?: boolean;
  interactive?: boolean;
  className?: string;
  title?: string;
  subtitle?: string;
  placeholder?: string;
  onSendMessage?: (content: string) => void;
  onClose?: () => void;
}

const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    sender: "assistant",
    content:
      "Hello! I'm your Persona AI assistant. How can I help you automate your tasks today?",
  },
  {
    id: "2",
    sender: "user",
    content: "I want to schedule my team reviews and check today's agenda.",
  },
  {
    id: "3",
    sender: "assistant",
    content:
      "I've retrieved your calendar and knowledge base chunks. Your demo session is locked for 10:00 AM IST. Would you like me to set a reminder 10 minutes prior?",
  },
];

function TypingIndicator({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-border bg-card/90 px-4 py-3 backdrop-blur-sm shadow-sm",
        className,
      )}
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-primary/70"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </motion.div>
  );
}

function MessageBubble({
  message,
  isLast,
}: {
  message: ChatMessage;
  isLast?: boolean;
}) {
  const isUser = (message.sender || message.role) === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97, x: isUser ? 16 : -16 }}
      animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div className={cn("flex items-end gap-2.5 max-w-[85%]", isUser && "flex-row-reverse")}>
        {!isUser && (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary border border-border text-foreground shadow-sm">
            <Sparkles className="size-3.5" />
          </div>
        )}
        <div className="flex flex-col gap-1 w-full">
          <motion.div
            layout
            className={cn(
              "rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed break-words shadow-sm transition-all",
              isUser
                ? "rounded-tr-sm bg-primary text-primary-foreground font-medium shadow-black/20"
                : "rounded-tl-sm border border-border bg-card text-card-foreground backdrop-blur-sm",
            )}
            whileHover={{ scale: 1.005 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            {message.content}
          </motion.div>
          {message.timestamp && (
            <span
              className={cn(
                "text-[10px] text-muted-foreground px-1 select-none",
                isUser ? "text-right" : "text-left",
              )}
            >
              {message.timestamp}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function ChatMessages({
  messages = DEFAULT_MESSAGES,
  autoPlay = false,
  autoPlayDelay = 1800,
  typingDuration = 1400,
  showReplay = false,
  interactive = true,
  className,
  title = "Persona AI Assistant",
  subtitle = "Always active & synchronized",
  placeholder,
  onSendMessage,
  onClose,
}: ChatMessagesProps) {
  const [visibleCount, setVisibleCount] = useState(
    autoPlay ? 0 : messages.length,
  );
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(messages);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAutoPlaying = useRef(false);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  const revealNext = useCallback(
    async (index: number) => {
      if (index >= chatMessages.length) {
        isAutoPlaying.current = false;
        return;
      }

      const message = chatMessages[index];

      if ((message.sender || message.role) === "assistant") {
        setIsTyping(true);
        await new Promise((r) => setTimeout(r, typingDuration));
        setIsTyping(false);
      }

      setVisibleCount(index + 1);
      await new Promise((r) => setTimeout(r, 100));
      scrollToBottom();

      await new Promise((r) =>
        setTimeout(
          r,
          autoPlayDelay -
            ((message.sender || message.role) === "assistant" ? typingDuration : 0) -
            100,
        ),
      );

      if (isAutoPlaying.current) {
        revealNext(index + 1);
      }
    },
    [chatMessages, autoPlayDelay, typingDuration, scrollToBottom],
  );

  const replay = useCallback(() => {
    setVisibleCount(0);
    setChatMessages(messages);
    isAutoPlaying.current = true;
    setTimeout(() => revealNext(0), 100);
  }, [messages, revealNext]);

  useEffect(() => {
    setChatMessages(messages);
    if (autoPlay) {
      setVisibleCount(0);
      isAutoPlaying.current = true;
      const timer = setTimeout(() => revealNext(0), 500);
      return () => {
        clearTimeout(timer);
        isAutoPlaying.current = false;
      };
    } else {
      setVisibleCount(messages.length);
    }
  }, [messages, autoPlay, revealNext]);

  useEffect(() => {
    scrollToBottom();
  }, [visibleCount, isTyping, scrollToBottom]);

  const handleSend = useCallback(() => {
    if (!inputValue.trim() || !interactive) return;

    const trimmed = inputValue.trim();
    const newMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, newMessage]);
    setInputValue("");
    setVisibleCount((prev) => prev + 1);

    if (onSendMessage) {
      onSendMessage(trimmed);
    } else {
      setTimeout(() => {
        const assistantReply: ChatMessage = {
          id: `assistant-${Date.now()}`,
          sender: "assistant",
          content:
            "I'm synchronized with your session and ready to assist.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setChatMessages((prev) => [...prev, assistantReply]);
        setVisibleCount((prev) => prev + 1);
      }, typingDuration + 300);
    }
  }, [inputValue, interactive, typingDuration, onSendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={cn(
        "relative flex flex-col h-full w-full overflow-hidden bg-background text-foreground",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-card/60 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="size-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-semibold tracking-tight text-foreground">{title}</h3>
            <p className="text-[11px] text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {showReplay && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={replay}
              aria-label="Replay conversation"
              className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/80 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
            >
              <RotateCcw className="size-3" />
              Replay
            </motion.button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close chat panel"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
        className="flex-1 space-y-3.5 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
      >
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 text-muted-foreground text-xs">
            <Sparkles className="size-8 mb-2 opacity-40" />
            <p className="font-medium text-foreground">No messages in this session yet.</p>
            <p className="mt-1">Speak into the mic or type below to chat!</p>
          </div>
        ) : (
          chatMessages.slice(0, visibleCount).map((message, i) => (
            <MessageBubble
              key={message.id}
              message={message}
              isLast={i === visibleCount - 1}
            />
          ))
        )}

        <AnimatePresence>{isTyping && <TypingIndicator />}</AnimatePresence>
      </div>

      {/* Input */}
      <div className="border-t border-border p-3.5 bg-card/60 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-3.5 py-2 transition-all focus-within:border-ring focus-within:ring-1 focus-within:ring-ring">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!interactive}
            placeholder={
              placeholder ||
              (interactive
                ? "Ask anything..."
                : "Demo mode - replay to watch again")
            }
            aria-label={
              interactive ? "Type your message" : "Chat input (demo mode)"
            }
            className="flex-1 bg-transparent text-xs sm:text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!interactive || !inputValue.trim()}
            aria-label="Send message"
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg transition-all cursor-pointer",
              interactive && inputValue.trim()
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed",
            )}
          >
            <Send className="size-3.5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

export default ChatMessages;
