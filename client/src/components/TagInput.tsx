import { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export function TagInput({ value = [], onChange, placeholder, maxTags = 5 }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  const addTag = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !value.includes(trimmed) && value.length < maxTags) {
      onChange([...value, trimmed]);
      setInputValue("");
    }
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {value.map((tag, index) => (
          <Badge 
            key={index} 
            variant="secondary"
            className="px-3 py-1 text-sm bg-secondary/50 hover:bg-secondary border border-white/10"
          >
            {tag}
            <button 
              type="button"
              onClick={() => removeTag(index)}
              className="ml-2 text-muted-foreground hover:text-destructive focus:outline-none"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="relative">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={value.length >= maxTags ? `Max ${maxTags} tags reached` : placeholder}
          disabled={value.length >= maxTags}
          className="bg-card border-white/10 focus:border-primary/50 transition-all"
        />
        <p className="text-xs text-muted-foreground mt-1.5 text-right">
          {value.length}/{maxTags} tags
        </p>
      </div>
    </div>
  );
}
