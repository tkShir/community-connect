import { useState, KeyboardEvent, useRef } from "react";
import { X, ChevronDown, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

export interface TagOption {
  key: string;
  label: string;
}

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  /** Simple string suggestions (legacy). */
  suggestions?: string[];
  /** Structured options with key/label. Takes precedence over suggestions. */
  options?: TagOption[];
  maxTags?: number;
  "data-testid"?: string;
  /**
   * When provided, the input becomes dropdown-only (no free-text entry).
   * This string is shown as the last item in the dropdown as an "add new" action.
   */
  addNewLabel?: string;
  /** Called when the user clicks the addNew item in the dropdown. */
  onAddNew?: () => void;
}

export function TagInput({
  value,
  onChange,
  placeholder = t("tag_input.placeholder"),
  suggestions = [],
  options,
  maxTags,
  "data-testid": testId,
  addNewLabel,
  onAddNew,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownOnly = !!addNewLabel;

  // Build key→label map from options (if provided)
  const keyToLabel: Record<string, string> = {};
  const labelToKey: Record<string, string> = {};
  const effectiveOptions: TagOption[] = options
    ? options
    : suggestions.map((s) => ({ key: s, label: s }));

  for (const opt of effectiveOptions) {
    keyToLabel[opt.key] = opt.label;
    labelToKey[opt.label] = opt.key;
  }

  const filteredOptions = dropdownOnly
    ? effectiveOptions.filter((opt) => !value.includes(opt.key))
    : effectiveOptions.filter(
        (opt) =>
          opt.label.toLowerCase().includes(inputValue.toLowerCase()) &&
          !value.includes(opt.key)
      );

  const addTag = (key: string) => {
    const trimmed = key.trim();
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

  const removeTag = (key: string) => {
    onChange(value.filter((k) => k !== key));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (dropdownOnly) return;
    if (e.key === "Enter") {
      e.preventDefault();
      if (inputValue.trim()) {
        const matchedKey = labelToKey[inputValue.trim()];
        addTag(matchedKey ?? inputValue.trim());
      }
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const displayLabel = (key: string) => keyToLabel[key] || key;

  const handleContainerClick = () => {
    if (dropdownOnly) {
      setShowSuggestions(true);
    } else {
      inputRef.current?.focus();
    }
  };

  return (
    <div className="relative">
      <div
        className={cn(
          "flex flex-wrap gap-2 p-2 min-h-[42px] rounded-md border border-white/10 bg-background focus-within:ring-1 focus-within:ring-primary",
          dropdownOnly && "cursor-pointer"
        )}
        onClick={handleContainerClick}
        data-testid={testId}
      >
        {value.map((key) => (
          <Badge
            key={key}
            variant="secondary"
            className="bg-primary/20 text-primary border-none gap-1 pr-1"
          >
            {displayLabel(key)}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(key);
              }}
              className="ml-1 hover:bg-white/10 rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}

        {dropdownOnly ? (
          <div className="flex flex-1 items-center justify-between min-w-[120px]">
            {value.length === 0 && (
              <span className="text-sm text-muted-foreground">{placeholder}</span>
            )}
            <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto" />
          </div>
        ) : (
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
          />
        )}
      </div>

      {showSuggestions && (filteredOptions.length > 0 || dropdownOnly) && (
        <div
          className="absolute z-50 mt-1 w-full max-h-48 overflow-auto rounded-md border border-white/10 bg-card shadow-lg"
          onMouseDown={(e) => e.preventDefault()} // prevent blur before click
        >
          {filteredOptions.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => {
                addTag(opt.key);
                if (!dropdownOnly) setShowSuggestions(false);
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-primary/10 hover:text-primary transition-colors"
            >
              {opt.label}
            </button>
          ))}
          {dropdownOnly && addNewLabel && onAddNew && (
            <button
              type="button"
              onClick={() => {
                setShowSuggestions(false);
                onAddNew();
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-primary/10 text-primary border-t border-white/10 flex items-center gap-2 font-medium"
            >
              <Plus className="h-3.5 w-3.5" />
              {addNewLabel}
            </button>
          )}
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {showSuggestions && dropdownOnly && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  );
}
