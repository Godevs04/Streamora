import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useColors } from '../hooks/useColors';

interface PatternInputProps {
  onPatternComplete: (pattern: string) => void;
  size?: number;
  dotSize?: number;
  lineWidth?: number;
}

interface Dot {
  id: number;
  x: number;
  y: number;
}

export default function PatternInput({ 
  onPatternComplete, 
  size = 300, 
  dotSize = 20, 
  lineWidth = 3 
}: PatternInputProps) {
  const colors = useColors();
  const styles = createStyles(colors, size, dotSize, lineWidth);
  
  const [pattern, setPattern] = useState<number[]>([]);
  
  const dots: Dot[] = [
    { id: 0, x: 0, y: 0 },
    { id: 1, x: size / 2, y: 0 },
    { id: 2, x: size, y: 0 },
    { id: 3, x: 0, y: size / 2 },
    { id: 4, x: size / 2, y: size / 2 },
    { id: 5, x: size, y: size / 2 },
    { id: 6, x: 0, y: size },
    { id: 7, x: size / 2, y: size },
    { id: 8, x: size, y: size },
  ];

  const handleDotPress = (dotId: number) => {
    if (!pattern.includes(dotId)) {
      const newPattern = [...pattern, dotId];
      setPattern(newPattern);
      
      if (newPattern.length >= 4) {
        onPatternComplete(newPattern.join('-'));
      }
    }
  };

  const handleReset = () => {
    setPattern([]);
  };

  const renderDot = (dot: Dot) => {
    const isSelected = pattern.includes(dot.id);
    const isLastSelected = pattern[pattern.length - 1] === dot.id;
    
    return (
      <TouchableOpacity
        key={dot.id}
        style={[
          styles.dot,
          isSelected && styles.dotSelected,
          isLastSelected && styles.dotLastSelected,
        ]}
        onPress={() => handleDotPress(dot.id)}
        activeOpacity={0.7}
      />
    );
  };

  const renderLine = (from: Dot, to: Dot) => {
    const fromIndex = pattern.indexOf(from.id);
    const toIndex = pattern.indexOf(to.id);
    
    if (fromIndex === -1 || toIndex === -1 || Math.abs(fromIndex - toIndex) !== 1) {
      return null;
    }

    return (
      <View
        key={`${from.id}-${to.id}`}
        style={[
          styles.line,
          {
            left: Math.min(from.x, to.x) + dotSize / 2,
            top: Math.min(from.y, to.y) + dotSize / 2,
            width: Math.abs(to.x - from.x),
            height: Math.abs(to.y - from.y),
            transform: [
              { rotate: Math.atan2(to.y - from.y, to.x - from.x) + 'rad' }
            ],
          },
        ]}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.patternContainer}>
        {/* Render lines between selected dots */}
        {pattern.map((dotId, index) => {
          if (index === 0) return null;
          const fromDot = dots.find(d => d.id === pattern[index - 1]);
          const toDot = dots.find(d => d.id === dotId);
          if (fromDot && toDot) {
            return renderLine(fromDot, toDot);
          }
          return null;
        })}
        
        {/* Render dots */}
        {dots.map(renderDot)}
      </View>
      
      {/* Instructions */}
      <Text style={styles.instructionText}>
        Tap dots to create your pattern (minimum 4 dots)
      </Text>
      
      {/* Reset button */}
      {pattern.length > 0 && (
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.resetButtonText}>Reset Pattern</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (colors: any, size: number, dotSize: number, lineWidth: number) => StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  patternContainer: {
    width: size,
    height: size,
    position: 'relative',
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dot: {
    position: 'absolute',
    width: dotSize,
    height: dotSize,
    borderRadius: dotSize / 2,
    backgroundColor: colors.background.primary,
    borderWidth: 3,
    borderColor: colors.border,
    shadowColor: colors.text.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dotSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  dotLastSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    transform: [{ scale: 1.2 }],
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  line: {
    position: 'absolute',
    backgroundColor: colors.primary,
    height: lineWidth,
    borderRadius: lineWidth / 2,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  instructionText: {
    color: colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  resetButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resetButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
