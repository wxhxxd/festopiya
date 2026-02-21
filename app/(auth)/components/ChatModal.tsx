'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';

// These "props" are the instructions we pass to the chat box so it knows who is talking to who
interface ChatModalProps {
  currentUserId: string;
  recipientId: string;
  recipientName: string;
  onClose: () => void;
}

export default function ChatModal({ currentUserId, recipientId, recipientName, onClose }: ChatModalProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom when a new message appears
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // 1. Fetch Chat History between these two specific users
    async function fetchMessages() {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });

      if (data) setMessages(data);
      setLoading(false);
    }
    fetchMessages();

    // 2. REALTIME LISTENER: Listen for new messages dropping into the database
    const channel = supabase
      .channel('realtime-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new;
          // Only add it to the screen if it belongs to this exact conversation
          if (
            (newMsg.sender_id === currentUserId && newMsg.receiver_id === recipientId) ||
            (newMsg.sender_id === recipientId && newMsg.receiver_id === currentUserId)
          ) {
            setMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    // Cleanup listener when chat is closed
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, recipientId, supabase]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const textToSend = newMessage;
    setNewMessage(''); // Clear input instantly for snappy UI feel

    const { error } = await supabase
      .from('messages')
      .insert([
        {
          sender_id: currentUserId,
          receiver_id: recipientId,
          message: textToSend,
        }
      ]);

    if (error) {
      alert("Message failed to send: " + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col overflow-hidden h-[600px] max-h-[90vh] animate-in fade-in zoom-in duration-200">
        
        {/* Chat Header */}
        <div className="bg-gray-900 text-white p-5 flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Chatting with</p>
            <h3 className="font-black text-xl italic">{recipientName}</h3>
          </div>
          <button onClick={onClose} className="bg-gray-800 hover:bg-red-600 text-white w-8 h-8 rounded-full font-black transition-colors">
            ✕
          </button>
        </div>

        {/* Message Area */}
        <div className="flex-1 p-5 overflow-y-auto bg-gray-50 space-y-4">
          {loading ? (
            <p className="text-center text-gray-400 font-bold uppercase text-xs mt-10 animate-pulse">Loading secure chat...</p>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-400 mt-10">
              <p className="font-bold uppercase tracking-widest text-xs">No messages yet</p>
              <p className="text-[10px] mt-1">Send a message to start negotiating.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === currentUserId;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] p-4 rounded-2xl text-sm ${
                    isMe 
                      ? 'bg-blue-600 text-white rounded-br-sm' 
                      : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm shadow-sm'
                  }`}>
                    {msg.message}
                    <p className={`text-[9px] mt-2 font-bold uppercase text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          {/* Invisible div to scroll to */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim()}
            className="bg-black hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-colors"
          >
            Send
          </button>
        </form>

      </div>
    </div>
  );
}