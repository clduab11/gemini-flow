import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface CommandInputProps {
  onSubmit: (command: string) => void;
}

export const CommandInput: React.FC<CommandInputProps> = ({ onSubmit }) => {
  const [input, setInput] = useState('');

  useInput((inputChar, key) => {
    if (key.return) {
      if (input.trim()) {
        onSubmit(input.trim());
        setInput('');
      }
    } else if (key.backspace || key.delete) {
      setInput((prev) => prev.slice(0, -1));
    } else if (!key.ctrl && !key.meta && inputChar) {
      setInput((prev) => prev + inputChar);
    }
  });

  return (
    <Box borderStyle="round" borderColor="blue" padding={1}>
      <Text color="blue">$ </Text>
      <Text>{input}</Text>
      <Text color="gray">_</Text>
    </Box>
  );
};
