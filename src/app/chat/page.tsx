"use client";

import { useEffect, useState, FormEvent, useCallback, useRef, Suspense } from "react";
import { supabase } from "../../lib/supabase/client";
import { useSearchParams, useRouter } from "next/navigation";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

function ChatContent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const recipientId = searchParams.get("userId"); 

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const checkAndFetchChat = useCallback(async () => {
    if (!recipientId) return;

    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", recipientId)
        .single();

      if (profileError || !profileData) {
        console.error("Profile not found");
        setLoading(false);
        return;
      }

      const isHardcoded = profileData.email?.endsWith('@locallink.dev') || false;
      if (isHardcoded) {
        alert("This user is not available at the moment.");
        router.push("/feed");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true });

      if (error) console.error("Error fetching messages:", error);
      else setMessages(data || []);

    } catch (err) {
      console.error("Error initializing chat:", err);
    } finally {
      setLoading(false);
    }
  }, [recipientId, router]);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (isMounted) {
        await checkAndFetchChat();
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [checkAndFetchChat]);

  useEffect(() => {
    if (!currentUserId || !recipientId) return;

    const roomName = `chat_${[currentUserId, recipientId].sort().join("_")}`;
    const channel = supabase.channel(roomName);

    channel
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMsg = payload.new as Message;
          if (
            (newMsg.sender_id === currentUserId && newMsg.receiver_id === recipientId) ||
            (newMsg.sender_id === recipientId && newMsg.receiver_id === currentUserId)
          ) {
            setMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const allPresences = Object.values(state).flat() as { user_id?: string }[];
        const isRecipientOnline = allPresences.some((p) => p.user_id === recipientId);
        
        setIsOnline(isRecipientOnline);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: currentUserId });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, recipientId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId || !recipientId) return;

    const { error } = await supabase.from("messages").insert({
      sender_id: currentUserId,
      receiver_id: recipientId,
      content: newMessage,
    });

    if (error) {
      console.error("Error sending message details:", JSON.stringify(error, null, 2));
    } else {
      setNewMessage("");
    }
  };

  if (!recipientId) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-2">Chat</h1>
        <p className="text-gray-500">Please select a user from the Users or Feed page to start chatting.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 flex flex-col h-[80vh]">
      <div className="flex justify-between items-center mb-4 border-b pb-3">
        <h1 className="text-2xl font-bold">Chat</h1>
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
          <span className="relative flex h-3 w-3 items-center justify-center">
            {isOnline && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            )}
            <span 
              style={{ 
                display: "inline-block", 
                width: "10px", 
                height: "10px", 
                borderRadius: "50%", 
                backgroundColor: isOnline ? "#22c55e" : "#9ca3af" 
              }}
            ></span>
          </span>
          <span className="text-sm font-medium text-gray-700">
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto border border-gray-200 p-4 rounded-xl mb-4 bg-gray-50 space-y-3">
        {loading ? (
          <div className="text-center text-gray-500 py-10">Loading conversation...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 py-10">No messages yet. Say hello! 👋</div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <div
                key={msg.id || index}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-xl text-sm ${
                    isMe
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-500">Loading chat...</div>}>
      <ChatContent />
    </Suspense>
  );
}