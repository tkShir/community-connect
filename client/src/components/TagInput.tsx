import { useState, KeyboardEvent, useRef } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  maxTags?: number;
  "data-testid"?: string;
}

export function TagInput({
  value,
  onChange,
  placeholder = t("tag_input.placeholder"),
  suggestions = [],
  maxTags,
  "data-testid": testId,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = suggestions.filter(
    (s) =>
      s.toLowerCase().includes(inputValue.toLowerCase()) &&
      !value.includes(s)
  );

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || value.includes(trimmed)) return;
    if (maxTags && maxTags === 1) {
      onChange([trimmed]);
    } else if (maxTags && value.length >= maxTags) {
      return;
    } else {
      onChange([...value, trimmed]);
    }
    setInputValue("");
    setShowSuggestions(false);
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div className="relative">
      <div
        className={cn(
          "flex flex-wrap gap-2 p-2 min-h-[42px] rounded-md border border-white/10 bg-background focus-within:ring-1 focus-within:ring-primary"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="bg-primary/20 text-primary border-none gap-1 pr-1"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="ml-1 hover:bg-white/10 rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          data-testid={testId}
        />
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-auto rounded-md border border-white/10 bg-card shadow-lg">
          {filteredSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addTag(suggestion)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-primary/10 hover:text-primary transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
