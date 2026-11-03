'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Plus, 
  History, 
  Trash2, 
  X, 
  MessageSquare,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ChatMessages } from '@/components/ui/chat-messages';
import { ChatSession, LanguageOption } from '@/lib/types';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeSession?: ChatSession;
  currentOption: LanguageOption;
  onSendMessage: (text: string) => void;
  isThinking?: boolean;
  sessions?: ChatSession[];
  activeSessionId?: string;
  onSelectSession?: (id: string) => void;
  onNewSession?: () => void;
  onDeleteSession?: (id: string) => void;
}

export function ChatPanel({
  isOpen,
  onClose,
  activeSession,
  currentOption,
  onSendMessage,
  isThinking = false,
  sessions = [],
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
}: ChatPanelProps) {
  const [showRecentChats, setShowRecentChats] = useState(false);

  // Map session messages to ChatMessages interface
  const formattedMessages = (activeSession?.messages || []).map((m) => ({
    id: m.id,
    sender: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
    content: m.content,
    timestamp: m.timestamp,
  }));

  const handleStartNewChat = () => {
    onNewSession?.();
    setShowRecentChats(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Right Sliding Side Panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            aria-label="Agent Chat Side Panel"
            className="fixed top-0 bottom-0 right-0 z-50 h-full w-full sm:w-[320px] md:w-[340px] lg:w-[350px] xl:w-[360px] flex flex-col pointer-events-auto border-l border-border bg-sidebar text-sidebar-foreground backdrop-blur-2xl shadow-[-16px_0_48px_rgba(0,0,0,0.8)]"
          >
            {/* Top Toolbar: New Chat, Recent Chats, Close */}
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border bg-card/80 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-2">
                {/* + New Chat Button */}
                <button
                  onClick={handleStartNewChat}
                  title="Start a new chat session"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shadow-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>New Chat</span>
                </button>

                {/* Recent Chats Dropdown Toggle */}
                <button
                  onClick={() => setShowRecentChats((prev) => !prev)}
                  title="View recent chat sessions"
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                    showRecentChats
                      ? 'bg-secondary text-foreground border-border font-semibold shadow-xs'
                      : 'border-border/60 bg-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Recent</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                    {sessions.length}
                  </span>
                  {showRecentChats ? (
                    <ChevronUp className="w-3 h-3 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  )}
                </button>
              </div>

              {/* Close Panel Button */}
              <button
                onClick={onClose}
                title="Close chat panel"
                aria-label="Close chat panel"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Collapsible Recent Chats Drawer */}
            <AnimatePresence>
              {showRecentChats && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-b border-border bg-card/95 backdrop-blur-md overflow-hidden shrink-0 z-20 shadow-md"
                >
                  <div className="p-3 max-h-[260px] overflow-y-auto no-scrollbar flex flex-col gap-1.5">
                    <div className="flex items-center justify-between px-1 mb-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      <span>Recent Chat Sessions</span>
                      <span>{sessions.length} total</span>
                    </div>

                    {sessions.length === 0 ? (
                      <div className="py-4 text-center text-xs text-muted-foreground">
                        No previous chats found.
                      </div>
                    ) : (
                      sessions.map((session) => {
                        const isActive = session.id === activeSessionId;
                        const msgCount = session.messages.length;

                        return (
                          <div
                            key={session.id}
                            className={`group flex items-center justify-between p-2 rounded-xl border transition-all text-xs cursor-pointer ${
                              isActive
                                ? 'bg-primary/10 border-primary/30 text-foreground font-semibold shadow-xs'
                                : 'border-border/40 hover:border-border hover:bg-secondary/40 text-muted-foreground hover:text-foreground'
                            }`}
                            onClick={() => {
                              onSelectSession?.(session.id);
                              setShowRecentChats(false);
                            }}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                              <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                              <div className="flex flex-col min-w-0">
                                <span className="truncate text-xs font-medium">
                                  {session.title || 'Untitled Chat'}
                                </span>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>{msgCount} {msgCount === 1 ? 'message' : 'messages'}</span>
                                </span>
                              </div>
                            </div>

                            {/* Individual Delete Button for this specific chat */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSession?.(session.id);
                              }}
                              title={`Delete "${session.title}"`}
                              aria-label={`Delete chat session ${session.title}`}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Chat Messages Stream & Input */}
            <div className="relative flex-1 w-full flex flex-col overflow-hidden bg-background/50">
              <ChatMessages
                key={activeSession?.id || 'default-chat'}
                messages={formattedMessages}
                interactive={true}
                showReplay={false}
                autoPlay={false}
                title={`${currentOption.name} · Assistant`}
                subtitle={`Live Session · ${currentOption.nativeName}`}
                placeholder={`Ask ${currentOption.name} anything...`}
                onSendMessage={onSendMessage}
                className="h-full w-full rounded-none border-none bg-transparent shadow-none"
              />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export default ChatPanel;
