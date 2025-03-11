import { useState, KeyboardEvent } from "react";
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
import { X, Plus, Loader2, UserPlus } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@clerk/clerk-react";

export function CreateConversationDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [participant, setParticipant] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getToken } = useAuth();
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
    // Basic validation
    if (!name.trim()) {
      toast.error("Please enter a name for the conversation");
      return;
    }

    if (participants.length === 0) {
      toast.error("Please add at least one participant");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await getToken();
      await api.post(
        "/conversation",
        {
          name,
          participants,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Conversation created successfully!");

      // Reset the form
      setName("");
      setParticipant("");
      setParticipants([]);

      // Close the dialog
      setOpen(false);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-secondary rounded-4xl p-6">
          <UserPlus size={20} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Conversation</DialogTitle>
          <DialogDescription>
            Enter a name for your conversation and add participants.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Conversation name"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="participant" className="text-right">
              Add User
            </Label>
            <div className="col-span-3 flex gap-2">
              <Input
                id="participant"
                value={participant}
                onChange={(e) => setParticipant(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="User ID "
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleAddParticipant}
                size="sm"
                disabled={!participant.trim()}
                className="gap-1"
              >
                <Plus size={16} /> Add
              </Button>
            </div>
          </div>

          {participants.length > 0 && (
            <div className="grid grid-cols-4 items-start gap-4">
              <span className="text-right font-medium text-sm text-muted-foreground pt-1">
                Participants:
              </span>
              <div className="col-span-3 flex flex-wrap gap-2 p-2 border rounded-md bg-muted/20">
                {participants.map((p, index) => (
                  <div
                    key={index}
                    className="bg-primary/10 border border-primary/20 px-2 py-1 rounded-md flex items-center text-sm"
                  >
                    {p}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 ml-1 text-muted-foreground hover:text-destructive rounded-full"
                      onClick={() => {
                        setParticipants(
                          participants.filter((_, i) => i !== index)
                        );
                        toast.info(`Removed ${p} from participants`);
                      }}
                    >
                      <X size={12} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !name.trim() || participants.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Conversation"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
