'use client';

import { MotionValue, motion, useSpring, useTransform } from 'framer-motion';
import { useEffect, useState, useRef, type CSSProperties } from 'react';
import './alpha-counter.css';

const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const N = 26;
const HALF = 13;

// Mirrors the original Number component — adapted for 26 letters
function Letter({
  mv,
  index,
  height,
  chars,
}: {
  mv: MotionValue<number>;
  index: number;
  height: number;
  chars: string;
}) {
  const y = useTransform(mv, (latest) => {
    const placeValue = ((latest % N) + N) % N;
    const offset = (N + index - placeValue) % N;
    let memo = offset * height;
    if (offset > HALF) {
      memo -= N * height;
    }
    return memo;
  });

  return (
    <motion.span className="ac-number" style={{ y }}>
      {chars[index]}
    </motion.span>
  );
}

function Slot({
  targetValue,
  height,
  chars,
  digitStyle,
}: {
  targetValue: number;
  height: number;
  chars: string;
  digitStyle?: CSSProperties;
}) {
  const animatedValue = useSpring(0);

  useEffect(() => {
    animatedValue.set(targetValue);
  }, [animatedValue, targetValue]);

  return (
    <span className="ac-digit" style={{ height, ...digitStyle }}>
      {Array.from({ length: N }, (_, i) => (
        <Letter key={i} mv={animatedValue} index={i} height={height} chars={chars} />
      ))}
    </span>
  );
}

interface Props {
  word: string;
  fontSize?: number;
  padding?: number;
  gap?: number;
  color?: string;
  weight?: number | string;
  font?: string;
  uppercase?: boolean;
  repeatInterval?: number;
  containerStyle?: CSSProperties;
  counterStyle?: CSSProperties;
  digitStyle?: CSSProperties;
}

export default function AlphaCounter({
  word,
  fontSize = 80,
  padding = 5,
  gap = 8,
  color = 'white',
  weight = 700,
  font = "'Space Mono', monospace",
  uppercase = false,
  repeatInterval = 0,
  containerStyle,
  counterStyle,
  digitStyle,
}: Props) {
  const height = fontSize + padding;
  const chars = uppercase ? UPPER : LOWER;
  const letters = word.toLowerCase().split('');

  // For repeating: cycle through different target values
  // On each cycle, we spin through extra letters before landing
  const [cycle, setCycle] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    if (repeatInterval <= 0) return;
    intervalRef.current = setInterval(() => setCycle(c => c + 1), repeatInterval);
    return () => clearInterval(intervalRef.current);
  }, [repeatInterval]);

  const defaultCounterStyle: CSSProperties = {
    fontSize,
    gap,
    color,
    fontWeight: weight,
    fontFamily: font,
  };

  return (
    <span className="ac-container" style={containerStyle}>
      <span className="ac-counter" style={{ ...defaultCounterStyle, ...counterStyle }}>
        {letters.map((ch, i) => {
          const baseIndex = LOWER.indexOf(ch);
          if (baseIndex === -1) {
            return (
              <span key={i} style={{ width: '0.3em', height, display: 'inline-block' }}>
                {ch}
              </span>
            );
          }
          const targetValue = baseIndex + cycle * N;
          return (
            <Slot
              key={i}
              targetValue={targetValue}
              height={height}
              chars={chars}
              digitStyle={digitStyle}
            />
          );
        })}
      </span>
    </span>
  );
}
