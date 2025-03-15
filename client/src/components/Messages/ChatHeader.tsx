import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  MoreHorizontal,
  PhoneCall,
  Users,
  Video,
  BellOff,
  ShieldAlert,
  ImageIcon,
  FileIcon,
  LinkIcon,
  Ban,
  MessageSquareX,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Chat } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@clerk/clerk-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
interface ChatHeaderProps {
  chat: Chat;
  onMobileMenuClick?: () => void;
  isMobileSidebarOpen?: boolean;
}

export function ChatHeader({
  chat,
  onMobileMenuClick,
  isMobileSidebarOpen,
}: ChatHeaderProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [groupParticipants, setGroupParticipants] = useState<any[]>([]);
  const { users, fetchUser, getUserFromId, reloadChats } = useChat();
  const { userId, getToken } = useAuth();
  const [activeTab, setActiveTab] = useState("about");
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!chat.isGroup) {
      const otherParticipant = chat?.participants?.find(
        (id: string) => id !== userId
      );
      if (otherParticipant) {
        async function fetchUserData() {
          const res = await getUserFromId(otherParticipant!);
          setUser(res);
        }
        fetchUserData();
      }
    } else if (chat.isGroup && showDetails) {
      async function fetchGroupParticipants() {
        const participantsData = [];
        for (const participantId of chat.participants || []) {
          const userData = await getUserFromId(participantId);
          if (userData) participantsData.push(userData);
        }
        setGroupParticipants(participantsData);
      }
      fetchGroupParticipants();
    }
  }, [chat, userId, users, fetchUser, showDetails]);

  const clearChatHistory = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteMessages = async () => {
    setLoading(true);
    try {
      await api.delete(`/message/${chat.id}/all`, {
        headers: {
          Authorization: `Bearer ${await getToken()}`,
        },
      });

      setShowDeleteConfirm(false);
      setShowDetails(false);
      toast.success("Chat history cleared successfully");
      reloadChats();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 border-b border-border flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur-sm z-10">
      <div className="flex items-center gap-3">
        {!isMobileSidebarOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden mr-1"
            onClick={onMobileMenuClick}
            aria-label="Back to chat list"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}

        <Avatar className="h-10 w-10 border border-border shadow-sm">
          {!chat.isGroup && user?.imageUrl && (
            <AvatarImage src={user.imageUrl} alt={user?.fullName || "User"} />
          )}
          <AvatarFallback
            className={cn(
              chat.isGroup
                ? "bg-gradient-to-br from-primary/80 to-primary text-primary-foreground"
                : "bg-gradient-to-br from-secondary to-secondary/70 text-secondary-foreground"
            )}
          >
            {chat.isGroup ? (
              <Users className="h-5 w-5" />
            ) : (
              user?.fullName?.[0].toUpperCase() || "U"
            )}
          </AvatarFallback>
        </Avatar>

        <div
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setShowDetails(true)}
        >
          <h3 className="font-medium text-foreground">{chat.name}</h3>
          <p className="text-xs text-muted-foreground">
            {chat.online ? (
              <span className="flex items-center">
                <span className="h-2 w-2 rounded-full bg-green-500 mr-1 animate-pulse"></span>
                Online
              </span>
            ) : (
              "Offline"
            )}
          </p>
        </div>
      </div>
      <div className="flex gap-1">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="hidden sm:flex">
                <PhoneCall className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Voice call</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="hidden sm:flex">
                <Video className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Video call</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDetails(true)}
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>More options</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Alert Dialog for Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Chat History</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all messages in this conversation?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMessages}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Deleting..." : "Delete All Messages"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Chat Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-center">
              {chat.name}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center py-2">
            {/* Profile Avatar */}
            <div className="mb-4 relative">
              <Avatar className="h-28 w-28 border-2 border-border shadow-md">
                {!chat.isGroup && user?.imageUrl && (
                  <AvatarImage
                    src={user.imageUrl}
                    alt={user?.fullName || "User"}
                  />
                )}
                <AvatarFallback
                  className={cn(
                    chat.isGroup
                      ? "bg-gradient-to-br from-primary/80 to-primary text-primary-foreground text-3xl"
                      : "bg-gradient-to-br from-secondary to-secondary/70 text-secondary-foreground text-3xl"
                  )}
                >
                  {chat.isGroup ? (
                    <Users className="h-12 w-12" />
                  ) : (
                    user?.fullName?.[0].toUpperCase() ||
                    chat.name[0].toUpperCase()
                  )}
                </AvatarFallback>
              </Avatar>
              {chat.online && (
                <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-background animate-pulse"></span>
              )}
            </div>

            {/* Profile Info */}
            <div className="text-center mb-5 w-full">
              <h3 className="text-xl font-medium mb-1">{chat.name}</h3>

              {!chat.isGroup && user && (
                <div className="text-sm text-muted-foreground">
                  {user.username && (
                    <p className="font-medium mb-1">@{user.username}</p>
                  )}
                  <p className="mb-1">
                    {chat.online ? (
                      <span className="text-green-500 font-medium flex items-center justify-center">
                        <span className="h-2 w-2 rounded-full bg-green-500 mr-1 animate-pulse"></span>
                        Online
                      </span>
                    ) : (
                      <span>Offline</span>
                    )}
                  </p>
                  {user.lastSeen && (
                    <p className="text-xs">
                      Last seen: {new Date(user.lastSeen).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {chat.isGroup && (
                <p className="text-sm text-muted-foreground">
                  Group · {chat.participants?.length || 0} participants
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mb-6 w-full justify-center">
              <Button size="sm" className="flex items-center gap-1 px-4">
                <PhoneCall className="h-4 w-4" />
                Call
              </Button>
              <Button size="sm" className="flex items-center gap-1 px-4">
                <Video className="h-4 w-4" />
                Video
              </Button>
              {!chat.isGroup && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 px-4"
                >
                  <BellOff className="h-4 w-4" />
                  Mute
                </Button>
              )}
            </div>

            <Separator className="mb-4" />

            {/* DM Tabs */}
            {!chat.isGroup && user && (
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid grid-cols-3 mb-4 w-full">
                  <TabsTrigger value="about">About</TabsTrigger>
                  <TabsTrigger value="media">Media</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="about" className="space-y-4">
                  <div className="w-full pt-2">
                    <h4 className="font-medium mb-3 text-center">About</h4>
                    <div className="bg-muted/50 p-4 rounded-lg mb-4">
                      <p className="text-sm text-muted-foreground text-center italic">
                        {user.bio || "No information provided"}
                      </p>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Email:</span>
                        <span className="text-muted-foreground">
                          {user?.emailAddresses?.[0]?.emailAddress ||
                            "Not available"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Phone:</span>
                        <span className="text-muted-foreground">
                          {user.phone || "Not available"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Joined:</span>
                        <span className="text-muted-foreground">
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString()
                            : "Unknown"}
                        </span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="media">
                  <div className="w-full pt-2">
                    <h4 className="font-medium mb-3 text-center">
                      Shared Media
                    </h4>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="aspect-square bg-muted rounded-md flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors"
                        >
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm bg-muted/50 p-3 rounded-md">
                      <div className="flex items-center gap-2">
                        <FileIcon className="h-4 w-4" /> <span>12 Files</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4" /> <span>5 Links</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="settings">
                  <div className="w-full pt-2">
                    <h4 className="font-medium mb-3 text-center">Settings</h4>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        size="sm"
                      >
                        <BellOff className="h-4 w-4 mr-2" /> Mute notifications
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        size="sm"
                      >
                        <Ban className="h-4 w-4 mr-2" /> Block user
                      </Button>
                      <Separator className="my-2" />
                      <Button
                        variant="outline"
                        className="w-full justify-start text-destructive hover:bg-destructive/10"
                        size="sm"
                        onClick={clearChatHistory}
                        disabled={loading}
                      >
                        <MessageSquareX className="h-4 w-4 mr-2" />
                        {loading ? "Processing..." : "Clear chat history"}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-destructive hover:bg-destructive/10"
                        size="sm"
                      >
                        <ShieldAlert className="h-4 w-4 mr-2" /> Report user
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}

            {/* Group Participants */}
            {chat.isGroup && (
              <div className="w-full pt-2">
                <h4 className="font-medium mb-3 text-center">Participants</h4>
                <div className="bg-muted/30 rounded-lg overflow-hidden">
                  {groupParticipants.map((participant, index) => (
                    <>
                      <div
                        key={participant.id}
                        className="flex items-center gap-3 p-3 hover:bg-muted/70 transition-colors"
                      >
                        <Avatar className="h-8 w-8 border border-border">
                          {participant.imageUrl ? (
                            <AvatarImage
                              src={participant.imageUrl}
                              alt={participant.fullName || "User"}
                            />
                          ) : (
                            <AvatarFallback className="bg-secondary text-secondary-foreground">
                              {participant.fullName?.[0].toUpperCase() || "U"}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium flex items-center">
                            {participant.firstName + " " + participant.lastName}
                            {participant.id === userId && (
                              <span className="text-xs bg-primary/20 text-primary rounded-full px-2 ml-2">
                                You
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            @{participant.username || "user"}
                          </p>
                        </div>
                        {participant.online && (
                          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                        )}
                      </div>
                      {index < groupParticipants.length - 1 && <Separator />}
                    </>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
