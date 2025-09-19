import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';
import React from 'react';

export function App() {
  return React.createElement(ExpoRoot, { 
    // @ts-ignore - context is a valid prop for ExpoRoot but TypeScript doesn't recognize it
    context: require.context('./app') 
  });
}

registerRootComponent(App);