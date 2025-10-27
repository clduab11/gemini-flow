import React from 'react';
import { Box, Text } from 'ink';
export const OutputPanel = ({ output }) => {
    // Show last 20 lines
    const visibleOutput = output.slice(-20);
    return (<Box flexDirection="column" borderStyle="round" borderColor="green" padding={1} height={20}>
      <Text bold color="green">Output</Text>
      <Box flexDirection="column" marginTop={1}>
        {visibleOutput.map((line, index) => (<Text key={index}>{line}</Text>))}
      </Box>
    </Box>);
};
