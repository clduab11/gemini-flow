/**
 * Reusable TUI Component: FormField
 *
 * An interactive form field for user input with validation
 */

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

export interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  validate?: (value: string) => { valid: boolean; error?: string };
  type?: 'text' | 'password' | 'number';
  maxLength?: number;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  value: initialValue,
  onChange,
  onSubmit,
  onCancel,
  placeholder = '',
  validate,
  type = 'text',
  maxLength = 100
}) => {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  useInput((input, key) => {
    if (key.return && onSubmit) {
      // Validate before submit
      if (validate) {
        const result = validate(value);
        if (!result.valid) {
          setError(result.error || 'Invalid input');
          return;
        }
      }
      setError(null);
      onSubmit(value);
    } else if (key.escape && onCancel) {
      setError(null);
      onCancel();
    } else if (key.backspace || key.delete) {
      const newValue = value.slice(0, -1);
      setValue(newValue);
      onChange(newValue);
      setError(null);
    } else if (input && !key.ctrl && !key.meta && value.length < maxLength) {
      // Only accept printable characters
      if (type === 'number' && !/^\d$/.test(input)) {
        return;
      }
      const newValue = value + input;
      setValue(newValue);
      onChange(newValue);
      setError(null);
    }
  });

  const displayValue = type === 'password' ? '•'.repeat(value.length) : value;
  const showPlaceholder = value.length === 0;

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={error ? 'red' : 'green'} paddingX={1}>
      <Box marginBottom={1}>
        <Text bold color="green">{label}</Text>
      </Box>

      <Box>
        <Text color="cyan">▶ </Text>
        {showPlaceholder ? (
          <Text dimColor>{placeholder}</Text>
        ) : (
          <Text>{displayValue}</Text>
        )}
        <Text color="cyan">█</Text>
      </Box>

      {error && (
        <Box marginTop={1}>
          <Text color="red">✗ {error}</Text>
        </Box>
      )}

      <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
        <Text dimColor>
          Enter: Submit  Esc: Cancel  Backspace: Delete
        </Text>
      </Box>
    </Box>
  );
};
