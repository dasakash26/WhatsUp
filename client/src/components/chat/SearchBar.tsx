import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export const SearchBar = ({ searchTerm, onSearchChange }: SearchBarProps) => {
  return (
    <div className="p-4 border-b bg-background/50 backdrop-blur-sm">
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 transition-colors group-focus-within:text-primary" />
        <Input
          type="text"
          placeholder="Search conversations..."
          className="pl-9 pr-10 w-full rounded-lg bg-accent/30 border-accent/50 focus:bg-accent/40 focus:border-primary/50 transition-all duration-200 hover:bg-accent/40"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 rounded-full hover:bg-accent/50"
            onClick={() => onSearchChange("")}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
};
