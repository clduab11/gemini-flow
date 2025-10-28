import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, useInput } from 'ink';
import { CommandHistory } from '../utils/CommandHistory.js';

interface CommandInputProps {
  onSubmit: (command: string) => void;
  availableCommands?: string[];
  availableAgentIds?: string[];
}

export const CommandInput: React.FC<CommandInputProps> = ({
  onSubmit,
  availableCommands = [],
  availableAgentIds = []
}) => {
  const [input, setInput] = useState('');
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [searchIndex, setSearchIndex] = useState(0);
  const [autocompleteOptions, setAutocompleteOptions] = useState<string[]>([]);
  const [autocompleteIndex, setAutocompleteIndex] = useState(0);
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  const historyRef = useRef<CommandHistory>(new CommandHistory());

  // Get autocomplete suggestions
  const getAutocompleteSuggestions = (partial: string): string[] => {
    if (!partial.trim()) return [];

    const suggestions: string[] = [];
    const seen = new Set<string>();

    // Get command-based suggestions
    const words = partial.split(' ');
    const lastWord = words[words.length - 1];

    // If typing first word, suggest commands
    if (words.length === 1) {
      availableCommands.forEach(cmd => {
        if (cmd.startsWith(partial) && !seen.has(cmd)) {
          suggestions.push(cmd);
          seen.add(cmd);
        }
      });
    }

    // If partial contains agent commands, suggest agent IDs
    if (partial.includes('swarm') || partial.includes('status') || partial.includes('terminate')) {
      availableAgentIds.forEach(id => {
        if (id.startsWith(lastWord) && !seen.has(id)) {
          const prefix = words.slice(0, -1).join(' ');
          suggestions.push(prefix ? `${prefix} ${id}` : id);
          seen.add(id);
        }
      });
    }

    // Add history-based suggestions
    const historySuggestions = historyRef.current.getAutocompleteSuggestions(partial);
    historySuggestions.forEach(s => {
      if (!seen.has(s)) {
        suggestions.push(s);
        seen.add(s);
      }
    });

    return suggestions.slice(0, 10); // Limit to 10 suggestions
  };

  useInput((inputChar, key) => {
    // Ctrl+R: Reverse search mode
    if (key.ctrl && inputChar === 'r') {
      setSearchMode(!searchMode);
      if (!searchMode) {
        setSearchQuery('');
        setSearchResults([]);
        setSearchIndex(0);
      }
      return;
    }

    // Escape: Exit search mode or hide autocomplete
    if (key.escape) {
      setSearchMode(false);
      setShowAutocomplete(false);
      setAutocompleteOptions([]);
      return;
    }

    // Search mode handling
    if (searchMode) {
      if (key.return) {
        // Select current search result
        if (searchResults.length > 0 && searchResults[searchIndex]) {
          setInput(searchResults[searchIndex]);
          setSearchMode(false);
          setSearchQuery('');
        }
        return;
      }

      if (key.backspace || key.delete) {
        const newQuery = searchQuery.slice(0, -1);
        setSearchQuery(newQuery);
        if (newQuery) {
          const results = historyRef.current.search(newQuery);
          setSearchResults(results);
          setSearchIndex(0);
        } else {
          setSearchResults([]);
        }
        return;
      }

      if (key.upArrow && searchResults.length > 0) {
        setSearchIndex((prev) => Math.max(0, prev - 1));
        return;
      }

      if (key.downArrow && searchResults.length > 0) {
        setSearchIndex((prev) => Math.min(searchResults.length - 1, prev + 1));
        return;
      }

      if (inputChar && !key.ctrl && !key.meta) {
        const newQuery = searchQuery + inputChar;
        setSearchQuery(newQuery);
        const results = historyRef.current.search(newQuery);
        setSearchResults(results);
        setSearchIndex(0);
      }
      return;
    }

    // Normal mode handling
    if (key.return) {
      if (input.trim()) {
        historyRef.current.add(input.trim());
        onSubmit(input.trim());
        setInput('');
        setShowAutocomplete(false);
        setAutocompleteOptions([]);
      }
      return;
    }

    // Up arrow: Navigate backward in history
    if (key.upArrow) {
      const prev = historyRef.current.getPrevious(input);
      if (prev !== null) {
        setInput(prev);
        setShowAutocomplete(false);
      }
      return;
    }

    // Down arrow: Navigate forward in history
    if (key.downArrow) {
      const next = historyRef.current.getNext();
      if (next !== null) {
        setInput(next);
        setShowAutocomplete(false);
      }
      return;
    }

    // Tab: Autocomplete
    if (key.tab) {
      if (!showAutocomplete) {
        const suggestions = getAutocompleteSuggestions(input);
        if (suggestions.length > 0) {
          setAutocompleteOptions(suggestions);
          setAutocompleteIndex(0);
          setShowAutocomplete(true);
          setInput(suggestions[0]);
        }
      } else {
        // Cycle through autocomplete options
        const nextIndex = (autocompleteIndex + 1) % autocompleteOptions.length;
        setAutocompleteIndex(nextIndex);
        setInput(autocompleteOptions[nextIndex]);
      }
      return;
    }

    // Backspace/Delete
    if (key.backspace || key.delete) {
      setInput((prev) => prev.slice(0, -1));
      setShowAutocomplete(false);
      historyRef.current.resetNavigation();
      return;
    }

    // Regular character input
    if (inputChar && !key.ctrl && !key.meta) {
      setInput((prev) => prev + inputChar);
      setShowAutocomplete(false);
      historyRef.current.resetNavigation();
    }
  });

  // Render search mode UI
  if (searchMode) {
    return (
      <Box flexDirection="column">
        <Box borderStyle="round" borderColor="magenta" padding={1}>
          <Text color="magenta">(reverse-i-search) `{searchQuery}`: </Text>
          <Text>{searchResults[searchIndex] || ''}</Text>
        </Box>
        {searchResults.length > 0 && (
          <Box marginTop={1} paddingLeft={2}>
            <Text dimColor>
              {searchResults.length} match{searchResults.length !== 1 ? 'es' : ''} found
              {searchResults.length > 1 && ` (${searchIndex + 1}/${searchResults.length})`}
              {' - ↑↓ to navigate, Enter to select, Esc to cancel'}
            </Text>
          </Box>
        )}
      </Box>
    );
  }

  // Render normal mode UI
  return (
    <Box flexDirection="column">
      <Box borderStyle="round" borderColor="blue" padding={1}>
        <Text color="blue">$ </Text>
        <Text>{input}</Text>
        <Text color="gray">_</Text>
      </Box>
      {showAutocomplete && autocompleteOptions.length > 1 && (
        <Box marginTop={1} paddingLeft={2}>
          <Text dimColor>
            Tab: {autocompleteOptions.slice(0, 3).join(' | ')}
            {autocompleteOptions.length > 3 && ` (+${autocompleteOptions.length - 3} more)`}
          </Text>
        </Box>
      )}
      <Box marginTop={1} paddingLeft={2}>
        <Text dimColor>
          ↑↓ History | Tab Autocomplete | Ctrl+R Search | Esc Clear
        </Text>
      </Box>
    </Box>
  );
};
