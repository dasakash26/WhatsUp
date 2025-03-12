import { Search, FilterIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export const SearchBar = ({ searchTerm, onSearchChange }: SearchBarProps) => {
  return (
    <div className="p-3 pb-4 border-b flex items-center justify-between gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder="Search chats..."
          className="pl-9 pr-4 w-full rounded-full bg-accent/40 focus:bg-accent/60 transition-colors"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <FilterIcon className="h-5 w-5 text-muted-foreground" />
    </div>
  );
};
