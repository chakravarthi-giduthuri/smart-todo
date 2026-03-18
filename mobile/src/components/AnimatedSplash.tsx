import { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  onFinish: () => void;
}

export function AnimatedSplash({ onFinish }: Props) {
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.timing(textOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(800),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(textOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
    ]).start(() => onFinish());
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconBox, { transform: [{ scale }], opacity }]}>
        <Ionicons name="checkmark" size={56} color="#fff" />
      </Animated.View>
      <Animated.Text style={[styles.title, { opacity: textOpacity }]}>
        Smart To-Do
      </Animated.Text>
      <Animated.Text style={[styles.sub, { opacity: textOpacity }]}>
        AI-powered tasks
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080810',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  iconBox: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: '#ec5b13',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  sub: { fontSize: 16, color: 'rgba(255,255,255,0.4)' },
});
