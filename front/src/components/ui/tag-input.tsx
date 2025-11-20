import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { normalizeTag, isValidTag, removeDuplicates } from '@/utils/tag-utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';

export interface Tag {
  id: number;
  nome: string;
}

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: Tag[];
  onSearch?: (query: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function TagInput({
  value,
  onChange,
  suggestions = [],
  onSearch,
  disabled = false,
  placeholder = 'Digite tags separadas por vírgula...',
  className,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filtrar sugestões que não estão já selecionadas
  const filteredSuggestions = suggestions.filter(
    (tag) => !value.includes(normalizeTag(tag.nome))
  );

  // Buscar sugestões quando digita
  useEffect(() => {
    if (inputValue.trim() && onSearch) {
      const timeoutId = setTimeout(() => {
        onSearch(inputValue.trim());
        setIsOpen(true);
      }, 300); // Debounce 300ms

      return () => clearTimeout(timeoutId);
    } else {
      setIsOpen(false);
    }
  }, [inputValue, onSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Verificar se digitou vírgula
    if (newValue.includes(',')) {
      const parts = newValue.split(',');
      const tagToAdd = parts[0].trim();

      if (tagToAdd) {
        addTag(tagToAdd);
      }

      // Manter o resto do texto após a vírgula
      const remaining = parts.slice(1).join(',').trim();
      setInputValue(remaining);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    // Enter: adicionar tag ou selecionar primeira sugestão
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (filteredSuggestions.length > 0 && isOpen) {
        // Selecionar primeira sugestão
        const firstSuggestion = filteredSuggestions[0];
        addTag(firstSuggestion.nome);
        setInputValue('');
        setIsOpen(false);
      } else if (inputValue.trim()) {
        // Adicionar tag digitada
        addTag(inputValue.trim());
        setInputValue('');
      }
    }

    // Backspace: remover última tag se input vazio
    if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value.length - 1);
    }

    // Escape: fechar dropdown
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const addTag = (tag: string) => {
    const normalized = normalizeTag(tag);

    if (!normalized || !isValidTag(normalized)) {
      return;
    }

    // Verificar duplicatas
    if (value.includes(normalized)) {
      return;
    }

    const newTags = [...value, normalized];
    onChange(removeDuplicates(newTags));
    setInputValue('');
  };

  const removeTag = (index: number) => {
    const newTags = value.filter((_, i) => i !== index);
    onChange(newTags);
  };

  const handleSuggestionClick = (tag: Tag) => {
    addTag(tag.nome);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Focar input ao clicar no container
  const handleContainerClick = () => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Popover open={isOpen && filteredSuggestions.length > 0} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div
            ref={containerRef}
            onClick={handleContainerClick}
            className={cn(
              'flex flex-wrap gap-2 min-h-[2.5rem] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
              'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
              disabled && 'cursor-not-allowed opacity-50',
              'cursor-text'
            )}
          >
            {/* Chips das tags */}
            {value.map((tag, index) => (
              <Badge
                key={`${tag}-${index}`}
                variant="secondary"
                className="flex items-center gap-1 px-2 py-1"
              >
                <span>{tag}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTag(index);
                    }}
                    className="ml-1 rounded-full hover:bg-destructive/20 p-0.5 transition-colors"
                    aria-label={`Remover tag ${tag}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}

            {/* Input */}
            <Input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (inputValue.trim() && filteredSuggestions.length > 0) {
                  setIsOpen(true);
                }
              }}
              disabled={disabled}
              placeholder={value.length === 0 ? placeholder : ''}
              className="flex-1 border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 min-w-[120px]"
            />
          </div>
        </PopoverTrigger>

        {/* Dropdown de sugestões */}
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <Command>
            <CommandList>
              {filteredSuggestions.length === 0 ? (
                <CommandEmpty>Nenhuma sugestão encontrada</CommandEmpty>
              ) : (
                <CommandGroup heading="Sugestões">
                  {filteredSuggestions.slice(0, 10).map((tag) => (
                    <CommandItem
                      key={tag.id}
                      onSelect={() => handleSuggestionClick(tag)}
                      className="cursor-pointer"
                    >
                      {tag.nome}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <p className="text-xs text-muted-foreground">
        Digite tags separadas por vírgula ou pressione Enter para adicionar
      </p>
    </div>
  );
}

