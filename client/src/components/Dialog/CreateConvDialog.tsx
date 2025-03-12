import { useState, KeyboardEvent, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus, Loader2, Users, MessageSquare } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@clerk/clerk-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/contexts/ChatContext";

type ConversationType = "direct" | "group";

export function CreateConvDialog() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ConversationType>("direct");
  const [groupName, setGroupName] = useState("");
  const [participant, setParticipant] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getToken } = useAuth();
  const { loadConversations } = useChat();

  // Reset states when dialog closes
  useEffect(() => {
    if (!open) {
      setActiveTab("direct");
      setGroupName("");
      setParticipant("");
      setParticipants([]);
    }
  }, [open]);

  const handleAddParticipant = () => {
    if (participant.trim()) {
      // Prevent duplicates
      if (!participants.includes(participant.trim())) {
        setParticipants([...participants, participant.trim()]);
        setParticipant("");
      } else {
        toast.error("This user is already added to the conversation");
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddParticipant();
    }
  };

  const handleSubmit = async () => {
    if (activeTab === "direct" && participants.length !== 1) {
      toast.error("Please add exactly one participant for direct messages");
      return;
    }

    if (activeTab === "group") {
      if (participants.length < 2) {
        toast.error(
          "Please add at least two participants for group conversations"
        );
        return;
      }

      if (!groupName.trim()) {
        toast.error("Please enter a name for the group conversation");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const token = await getToken();
      await api.post(
        "/conversation",
        {
          name: activeTab === "direct" ? "Direct Message" : groupName,
          participants,
          type: activeTab,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(
        `${
          activeTab === "direct" ? "Direct message" : "Group conversation"
        } created successfully!`
      );
      setOpen(false);
      await loadConversations();
    } catch (error: any) {
      console.error("Failed to create conversation:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to create conversation. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderParticipantsList = () => {
    if (participants.length === 0) return null;

    return (
      <div className="mt-4">
        <Label className="text-sm text-muted-foreground mb-2 block">
          {participants.length}{" "}
          {participants.length === 1 ? "Participant" : "Participants"}
        </Label>
        <ScrollArea className="h-[100px] border rounded-md p-2">
          <div className="flex flex-wrap gap-2">
            {participants.map((p, index) => (
              <Badge key={index} variant="secondary" className="py-1 gap-1">
                {p}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 rounded-full"
                  onClick={() => {
                    setParticipants(participants.filter((_, i) => i !== index));
                  }}
                >
                  <X size={10} />
                </Button>
              </Badge>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-secondary hover:bg-secondary/80">
          <Plus size={20} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>
            Create a new direct message or group conversation
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as ConversationType)}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="direct" className="flex gap-2 items-center">
              <MessageSquare size={16} />
              Direct Message
            </TabsTrigger>
            <TabsTrigger value="group" className="flex gap-2 items-center">
              <Users size={16} />
              Group Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="direct" className="space-y-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="direct-participant">Add User</Label>
              <div className="flex gap-2">
                <Input
                  id="direct-participant"
                  placeholder="Enter user ID"
                  value={participant}
                  onChange={(e) => setParticipant(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={participants.length >= 1}
                />
                <Button
                  onClick={handleAddParticipant}
                  disabled={!participant.trim() || participants.length >= 1}
                >
                  Add
                </Button>
              </div>
              {participants.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Add the user ID of the person you want to message
                </p>
              )}
              {renderParticipantsList()}
            </div>
          </TabsContent>

          <TabsContent value="group" className="space-y-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                placeholder="Enter group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="group-participant">Add Participants</Label>
              <div className="flex gap-2">
                <Input
                  id="group-participant"
                  placeholder="Enter user ID"
                  value={participant}
                  onChange={(e) => setParticipant(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <Button
                  onClick={handleAddParticipant}
                  disabled={!participant.trim()}
                >
                  Add
                </Button>
              </div>
              {participants.length < 2 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Add at least 2 participants to create a group
                </p>
              )}
              {renderParticipantsList()}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 pt-4 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              (activeTab === "direct" && participants.length !== 1) ||
              (activeTab === "group" &&
                (participants.length < 2 || !groupName.trim()))
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
