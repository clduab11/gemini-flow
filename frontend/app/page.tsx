/**
 * Main Page Component - Next.js App Router
 * 
 * This is the main container for the React Flow canvas with 
 * Zustand state management and NextAuth.js authentication.
 */

'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import Flow from '../src/components/Flow';
import { useNodes, useEdges } from '../src/lib/store';

const HomePage: React.FC = () => {
  const nodes = useNodes();
  const edges = useEdges();
  
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* Header with title and performance info */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #e0e0e0',
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ 
            margin: 0, 
            fontSize: '24px', 
            fontWeight: 600,
            color: '#1a192b'
          }}>
            Gemini Flow - React Flow Canvas
          </h1>
          <p style={{ 
            margin: '4px 0 0 0', 
            fontSize: '14px', 
            color: '#666'
          }}>
            Powered by Zustand + NextAuth.js for optimal performance & persistence
          </p>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          fontSize: '14px'
        }}>
          <div style={{
            background: '#f0f9ff',
            border: '1px solid #0ea5e9',
            borderRadius: '6px',
            padding: '8px 12px',
            color: '#0369a1'
          }}>
            <strong>Performance Mode:</strong> Zustand + Next.js
          </div>
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #22c55e',
            borderRadius: '6px',
            padding: '8px 12px',
            color: '#166534'
          }}>
            Nodes: {nodes.length} | Edges: {edges.length}
          </div>
        </div>
      </div>

      {/* Main Flow Canvas */}
      <div style={{ 
        paddingTop: '80px', // Account for header
        height: '100vh'
      }}>
        <Flow />
      </div>

      {/* Footer with architecture info */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid #e0e0e0',
        padding: '8px 20px',
        fontSize: '12px',
        color: '#666',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div>
          ✅ <strong>Architecture:</strong> 
          Next.js + Zustand state management + NextAuth.js authentication
        </div>
        <div>
          📊 <strong>Features:</strong>
          User Authentication • Flow Persistence • Selective re-rendering
        </div>
      </div>
    </div>
  );
};

// Wrap with SessionProvider for NextAuth.js
export default function Page() {
  return (
    <SessionProvider>
      <HomePage />
    </SessionProvider>
  );
}