import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { Chat, Message } from "@/types";
import { api } from "@/lib/api";
import { useAuth } from "@clerk/clerk-react";

interface ChatContextType {
  chats: Chat[];
  activeChat: Chat | null;
  isLoading: boolean;
  setActiveChat: (chat: Chat | null) => void;
  sendMessage: (content: string) => void;
  messages: Message[];
  fetchChats: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getToken } = useAuth();

  const messages = activeChat?.messages || [];

  const fetchChats = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const response = await api.get("/conversation", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const processedChats = response.data.map((chat: any) => ({
        ...chat,
        online: chat.online || false,
        unreadCount: chat.unreadCount || 0,
        lastMessage: chat.lastMessage || "",
        messages: chat.messages || [],
      }));

      setChats(processedChats);

      if (!activeChat && processedChats.length > 0) {
        setActiveChat(processedChats[0]);
      }

      if (activeChat) {
        const updatedActiveChat = processedChats.find(
          (chat: any) => chat.id === activeChat.id
        );
        if (updatedActiveChat) {
          setActiveChat(updatedActiveChat);
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching chats:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = async (content: string) => {
    if (!activeChat) return;

    try {
      const token = await getToken();
      const response = await api.post(
        `/message/${activeChat.id}`,
        {
          text: content,
          image: null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const newMessage = response.data;
      setActiveChat({
        ...activeChat,
        messages: [...(activeChat.messages || []), newMessage],
        lastMessage: content,
      });

      await fetchChats();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        activeChat,
        isLoading,
        setActiveChat,
        sendMessage,
        messages,
        fetchChats,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
