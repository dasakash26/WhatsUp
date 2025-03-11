import { api } from "@/lib/api";
import { useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";

// Define the Chat type for better type safety
interface Chat {
  id: string | number;
  name: string;
  isGroup: boolean;
  participants: string[];
  createdAt: string;
  lastMessage?: string;
  lastMessageTime?: Date | string;
  unreadCount?: number;
  online?: boolean;
}

export function useChat() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getToken } = useAuth();

  useEffect(() => {
    async function fetchConversations() {
      setIsLoading(true);
      try {
        const token = await getToken();
        const response = await api.get("/conversation", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log(response.data);

        // Add default values for fields that might not be in the API response
        const processedChats = response.data.map((chat: any) => ({
          ...chat,
          online: chat.online || false,
          unreadCount: chat.unreadCount || 0,
          lastMessage: chat.lastMessage || "",
        }));

        setChats(processedChats);
        setIsLoading(false);
      } catch (error) {
        console.error(error);
        setIsLoading(false);
      }
    }

    fetchConversations();
  }, [getToken]);

  return { chats, isLoading };
}
