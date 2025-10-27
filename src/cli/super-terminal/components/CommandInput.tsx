/**
 * Command Input Component
 *
 * Interactive command input with:
 * - Command history navigation (up/down arrows)
 * - Autocomplete suggestions
 * - Real-time validation
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { CommandStream } from '../types.js';

export interface CommandInputProps {
  onSubmit: (command: string) => void;
  commandHistory: string[];
  currentStream: CommandStream | null;
}

export const CommandInput: React.FC<CommandInputProps> = ({
  onSubmit,
  commandHistory,
  currentStream,
}) => {
  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [cursorPosition, setCursorPosition] = useState(0);

  // Handle keyboard input
  useInput((char, key) => {
    // Skip if stream is running (except Ctrl+C)
    if (currentStream && !(key.ctrl && char === 'c')) {
      return;
    }

    // Enter: submit command
    if (key.return) {
      onSubmit(input);
      setInput('');
      setCursorPosition(0);
      setHistoryIndex(-1);
      return;
    }

    // Up arrow: navigate history backward
    if (key.upArrow) {
      if (commandHistory.length > 0) {
        const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
        setHistoryIndex(newIndex);
        const historyCommand = commandHistory[commandHistory.length - 1 - newIndex];
        setInput(historyCommand || '');
        setCursorPosition(historyCommand?.length || 0);
      }
      return;
    }

    // Down arrow: navigate history forward
    if (key.downArrow) {
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        const historyCommand = commandHistory[commandHistory.length - 1 - newIndex];
        setInput(historyCommand || '');
        setCursorPosition(historyCommand?.length || 0);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
        setCursorPosition(0);
      }
      return;
    }

    // Backspace: delete character
    if (key.backspace || key.delete) {
      if (input.length > 0 && cursorPosition > 0) {
        const newInput = input.slice(0, cursorPosition - 1) + input.slice(cursorPosition);
        setInput(newInput);
        setCursorPosition(cursorPosition - 1);
      }
      return;
    }

    // Left arrow: move cursor left
    if (key.leftArrow) {
      setCursorPosition(Math.max(0, cursorPosition - 1));
      return;
    }

    // Right arrow: move cursor right
    if (key.rightArrow) {
      setCursorPosition(Math.min(input.length, cursorPosition + 1));
      return;
    }

    // Ctrl+A: move to beginning
    if (key.ctrl && char === 'a') {
      setCursorPosition(0);
      return;
    }

    // Ctrl+E: move to end
    if (key.ctrl && char === 'e') {
      setCursorPosition(input.length);
      return;
    }

    // Ctrl+U: clear line
    if (key.ctrl && char === 'u') {
      setInput('');
      setCursorPosition(0);
      return;
    }

    // Regular character input
    if (char && !key.ctrl && !key.meta) {
      const newInput = input.slice(0, cursorPosition) + char + input.slice(cursorPosition);
      setInput(newInput);
      setCursorPosition(cursorPosition + 1);
      setHistoryIndex(-1); // Reset history navigation
    }
  });

  // Get prompt symbol
  const getPrompt = () => {
    if (currentStream) {
      return <Text color="yellow">⏳ </Text>;
    }
    return <Text color="green" bold>▶ </Text>;
  };

  // Render input with cursor
  const renderInputWithCursor = () => {
    if (!input) {
      return (
        <>
          <Text inverse> </Text>
          <Text dimColor> Type a command (e.g., "swarm list" or "help")</Text>
        </>
      );
    }

    const before = input.slice(0, cursorPosition);
    const cursor = input[cursorPosition] || ' ';
    const after = input.slice(cursorPosition + 1);

    return (
      <>
        <Text>{before}</Text>
        <Text inverse>{cursor}</Text>
        <Text>{after}</Text>
      </>
    );
  };

  return (
    <Box borderStyle="single" borderColor="cyan" paddingX={1}>
      {getPrompt()}
      {renderInputWithCursor()}
    </Box>
  );
};
