import React, { useEffect } from 'react';
import { Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

export type ReactionType = 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY';

interface ReactionPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: ReactionType) => void;
}

const reactions: { type: ReactionType; emoji: string; label: string; color: string }[] = [
  { type: 'LIKE', emoji: '👍', label: 'Thích', color: '#1877F2' },
  { type: 'LOVE', emoji: '❤️', label: 'Yêu thích', color: '#F33E58' },
  { type: 'HAHA', emoji: '😆', label: 'Haha', color: '#F7B125' },
  { type: 'WOW', emoji: '😮', label: 'Wow', color: '#F7B125' },
  { type: 'SAD', emoji: '😢', label: 'Buồn', color: '#F7B125' },
  { type: 'ANGRY', emoji: '😠', label: 'Phẫn nộ', color: '#E9710F' },
];

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function ReactionButton({ 
  reaction, 
  index, 
  onSelect 
}: { 
  reaction: typeof reactions[0]; 
  index: number;
  onSelect: () => void;
}) {
  const scale = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    // Staggered entrance animation
    scale.value = withDelay(
      index * 50,
      withSpring(1, {
        damping: 15,
        stiffness: 150,
      })
    );
    translateY.value = withDelay(
      index * 50,
      withSpring(0, {
        damping: 15,
        stiffness: 150,
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  const handlePress = () => {
    // Bounce animation on press
    scale.value = withSequence(
      withTiming(1.3, { duration: 100, easing: Easing.out(Easing.ease) }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
    
    setTimeout(onSelect, 150);
  };

  const handlePressIn = () => {
    scale.value = withSpring(1.2, { damping: 10, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 200 });
  };

  return (
    <AnimatedTouchable
      style={[styles.reactionButton, animatedStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Text style={styles.emoji}>{reaction.emoji}</Text>
      <Text style={[styles.label, { color: reaction.color }]}>
        {reaction.label}
      </Text>
    </AnimatedTouchable>
  );
}

export default function ReactionPicker({ visible, onClose, onSelect }: ReactionPickerProps) {
  const containerScale = useSharedValue(0);
  const containerOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      containerScale.value = withSpring(1, {
        damping: 15,
        stiffness: 200,
      });
      containerOpacity.value = withTiming(1, { duration: 200 });
    } else {
      containerScale.value = withTiming(0, { duration: 150 });
      containerOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: containerScale.value }],
    opacity: containerOpacity.value,
  }));

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value * 0.5,
  }));

  const handleSelect = (type: ReactionType) => {
    onSelect(type);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <Animated.View style={[styles.overlayBackground, overlayAnimatedStyle]} />
        <Animated.View style={[styles.container, containerAnimatedStyle]}>
          {reactions.map((reaction, index) => (
            <ReactionButton
              key={reaction.type}
              reaction={reaction}
              index={index}
              onSelect={() => handleSelect(reaction.type)}
            />
          ))}
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingHorizontal: 8,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  reactionButton: {
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  emoji: {
    fontSize: 28,
    marginBottom: 2,
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
  },
});
