'use client';

import { X, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  placeholder?: string;
  className?: string;
  size?: 'default' | 'small';
  inputTestId?: string;
  autoFocus?: boolean;
}

export function SearchInput({
  value,
  onChange,
  onKeyDown,
  onFocus,
  placeholder = 'Search for your favorite food or meal',
  className,
  size = 'default',
  inputTestId = 'food-search-input',
  autoFocus = false,
}: SearchInputProps) {
  const isSmall = size === 'small';

  return (
    <div className={`bg-background border border-border/60 shadow-sm rounded-2xl ${className ?? ''}`}>
      <div className={`flex items-center gap-3 ${isSmall ? 'px-3 py-2' : 'px-5 py-3'}`}>
        {isSmall ? (
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <span className="inline-flex items-center rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground whitespace-nowrap shrink-0">
            Search Foods
          </span>
        )}
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          autoFocus={autoFocus}
          placeholder={placeholder}
          className={`border-0 shadow-none focus-visible:ring-0 bg-transparent px-0 placeholder:text-muted-foreground ${isSmall ? 'h-6 text-sm' : 'h-10 text-base'}`}
          aria-label="Search foods"
          data-testid={inputTestId}
          autoComplete="off"
          aria-autocomplete="list"
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange('')}
            className="shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
            data-testid="food-search-clear"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
