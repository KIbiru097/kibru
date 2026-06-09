import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { motion } from 'framer-motion';
import { Send, MessageCircle, ArrowLeft } from 'lucide-react';
import { MY_CONVERSATIONS, CONVERSATION_MESSAGES, SEND_MESSAGE, UNREAD_COUNT } from '../lib/queries';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: string; conversationId: string; senderId: string; messageText: string; messageStatus: string; sentAt: string;
}

interface Conversation {
  id: string; createdAt: string; updatedAt: string;
}

export default function MessagingPage() {
  const { user } = useAuth();
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);
  const [newMsg, setNewMsg] = useState('');

  const { data: convosData } = useQuery(MY_CONVERSATIONS, { skip: !user });
  const { data: unreadData } = useQuery(UNREAD_COUNT, { skip: !user });
  const { data: msgsData, refetch: refetchMsgs } = useQuery(CONVERSATION_MESSAGES, {
    variables: { conversationId: selectedConvo, limit: 50 },
    skip: !selectedConvo,
    pollInterval: 3000
  });

  const [sendMessage] = useMutation(SEND_MESSAGE, {
    onCompleted: () => { setNewMsg(''); refetchMsgs(); }
  });

  const conversations: Conversation[] = convosData?.myConversations || [];
  const messages: Message[] = msgsData?.conversationMessages || [];
  const unread = unreadData?.unreadMessageCount || 0;

  if (!user) {
    return (
      <div className="text-center py-20">
        <MessageCircle size={48} className="mx-auto text-text-light mb-4" />
        <p className="text-text-muted text-lg">Please log in to view messages</p>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {selectedConvo && (
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSelectedConvo(null)} className="md:hidden p-2 rounded-xl bg-surface-warm">
              <ArrowLeft size={20} />
            </motion.button>
          )}
          <div>
            <h1 className="text-3xl font-bold font-[var(--font-heading)]">Messages</h1>
            {unread > 0 && <span className="text-primary text-sm font-semibold">{unread} unread</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-220px)]">
        {/* Conversations list */}
        <div className={`bg-surface rounded-3xl border border-border p-3 overflow-y-auto ${selectedConvo ? 'hidden md:block' : ''}`}>
          {conversations.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <MessageCircle size={32} className="mx-auto mb-3 text-text-light" />
              <p>No conversations yet</p>
            </div>
          ) : conversations.map((c) => (
            <motion.button key={c.id} whileHover={{ scale: 1.01 }}
              onClick={() => setSelectedConvo(c.id)}
              className={`w-full text-left p-4 rounded-2xl mb-2 transition-all ${selectedConvo === c.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-surface-warm'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                  <MessageCircle size={18} className="text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">Conversation</p>
                  <p className="text-text-muted text-xs truncate">{new Date(c.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Messages area */}
        <div className={`md:col-span-2 bg-surface rounded-3xl border border-border flex flex-col ${!selectedConvo ? 'hidden md:flex' : ''}`}>
          {!selectedConvo ? (
            <div className="flex-1 flex items-center justify-center text-text-muted">
              <div className="text-center">
                <MessageCircle size={48} className="mx-auto mb-3 text-text-light" />
                <p>Select a conversation to start chatting</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => {
                  const isMine = msg.senderId === user.id;
                  return (
                    <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${isMine ? 'bg-primary text-white rounded-br-lg' : 'bg-surface-warm text-text rounded-bl-lg'}`}>
                        <p className="text-sm">{msg.messageText}</p>
                        <p className={`text-[10px] mt-1 ${isMine ? 'text-white/60' : 'text-text-muted'}`}>
                          {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <form onSubmit={e => { e.preventDefault(); if (newMsg.trim()) sendMessage({ variables: { conversationId: selectedConvo, content: newMsg } }); }}
                className="p-4 border-t border-border flex gap-3">
                <input value={newMsg} onChange={e => setNewMsg(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-2xl border border-border bg-bg-alt text-sm focus:border-primary outline-none"
                  placeholder="Type a message..." />
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit"
                  className="p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/25">
                  <Send size={20} />
                </motion.button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
