// Slash Command Autocomplete Component
import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAutocompleteNavigation } from '../hooks/useAutocompleteNavigation';
import { cn } from '../utils/classNames';

interface SlashCommand {
  name: string;
  description: string;
  usage: string;
}

interface SlashCommandAutocompleteProps {
  inputValue: string;
  onSelect: (command: SlashCommand) => void;
  onClose: () => void;
}

export default function SlashCommandAutocomplete({
  inputValue,
  onSelect,
  onClose
}: SlashCommandAutocompleteProps) {
  const [commands, setCommands] = useState<SlashCommand[]>([]);
  const [filteredCommands, setFilteredCommands] = useState<SlashCommand[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use shared autocomplete navigation hook
  const { selectedIndex, handleItemClick } = useAutocompleteNavigation({
    items: filteredCommands,
    onSelect,
    onClose,
    containerRef,
    enabled: filteredCommands.length > 0
  });

  // Load commands on mount
  useEffect(() => {
    const loadCommands = async () => {
      try {
        const result = await api.get<SlashCommand[]>('/chatbot/commands');
        setCommands(result.data);
      } catch {
        setCommands([]);
      } finally {
        setLoading(false);
      }
    };

    loadCommands();
  }, []);

  // Filter commands based on input
  useEffect(() => {
    if (!inputValue.startsWith('/')) {
      setFilteredCommands([]);
      return;
    }

    const query = inputValue.slice(1).toLowerCase();

    if (query === '') {
      setFilteredCommands(commands);
    } else {
      setFilteredCommands(
        commands.filter(
          (cmd) =>
            cmd.name.toLowerCase().startsWith(query) ||
            cmd.description.toLowerCase().includes(query)
        )
      );
    }
  }, [inputValue, commands]);

  if (loading || filteredCommands.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="popup-container"
      style={{
        bottom: 'calc(100% + 8px)',
        left: 0,
        right: 0,
        maxHeight: '300px',
        overflowY: 'auto'
      }}
    >
      <div className="px-3 py-2 text-subtle border-b border-discord-dark">
        Slash-kommandon
      </div>
      <ul className="py-1">
        {filteredCommands.map((cmd, index) => (
          <li
            key={cmd.name}
            onClick={() => handleItemClick(cmd)}
            className={cn(
              'popup-list-item',
              index === selectedIndex
                ? 'popup-list-item-selected'
                : 'popup-list-item-default'
            )}
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-[#5865f2]">/{cmd.name}</span>
              <span className="text-muted">{cmd.description}</span>
            </div>
            <div className="text-subtle mt-1">{cmd.usage}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
