import { memo, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Plus, Tag } from "lucide-react";

interface TaskTagsInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  readOnly?: boolean;
}

const COMMON_TAGS = [
  'urgent',
  'bug',
  'feature',
  'enhancement',
  'documentation',
  'design',
  'backend',
  'frontend',
  'testing',
  'review',
];

export const TaskTagsInput = memo(function TaskTagsInput({
  tags = [],
  onChange,
  placeholder = "Add tags...",
  maxTags = 10,
  readOnly = false,
}: TaskTagsInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < maxTags) {
      onChange([...tags, trimmedTag]);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      handleRemoveTag(tags[tags.length - 1]);
    }
  };

  const filteredSuggestions = COMMON_TAGS.filter(
    tag => !tags.includes(tag) && tag.includes(inputValue.toLowerCase())
  );

  const getTagColor = (tag: string) => {
    const colors: Record<string, string> = {
      urgent: 'bg-red-100 text-red-700 border-red-200',
      bug: 'bg-red-100 text-red-700 border-red-200',
      feature: 'bg-blue-100 text-blue-700 border-blue-200',
      enhancement: 'bg-green-100 text-green-700 border-green-200',
      documentation: 'bg-purple-100 text-purple-700 border-purple-200',
      design: 'bg-pink-100 text-pink-700 border-pink-200',
      backend: 'bg-orange-100 text-orange-700 border-orange-200',
      frontend: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      testing: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      review: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    };
    return colors[tag] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  if (readOnly) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {tags.length === 0 ? (
          <span className="text-xs text-muted-foreground">No tags</span>
        ) : (
          tags.map(tag => (
            <Badge
              key={tag}
              variant="outline"
              className={`text-xs ${getTagColor(tag)}`}
            >
              {tag}
            </Badge>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map(tag => (
          <Badge
            key={tag}
            variant="outline"
            className={`text-xs gap-1 ${getTagColor(tag)}`}
          >
            <Tag className="w-3 h-3" />
            {tag}
            <button
              type="button"
              onClick={() => handleRemoveTag(tag)}
              className="ml-1 hover:bg-black/10 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>

      {tags.length < maxTags && (
        <div className="relative">
          <div className="relative">
            <Input
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder={placeholder}
              className="h-8 text-sm"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-8 w-8 p-0"
              onClick={() => handleAddTag(inputValue)}
              disabled={!inputValue.trim()}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg p-2">
              <div className="text-xs text-muted-foreground mb-1.5">Suggestions</div>
              <div className="flex flex-wrap gap-1">
                {filteredSuggestions.slice(0, 6).map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAddTag(tag)}
                    className={`text-xs px-2 py-1 rounded border ${getTagColor(tag)} hover:opacity-80`}
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tags.length >= maxTags && (
        <p className="text-xs text-muted-foreground">
          Maximum {maxTags} tags allowed
        </p>
      )}
    </div>
  );
});

export default TaskTagsInput;
