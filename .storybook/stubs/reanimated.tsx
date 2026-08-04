// Minimal stand-in for react-native-reanimated, Storybook only.
// The real package (and its official mock.js) pulls in Fabric-only internals
// that don't exist in react-native-web and crash Vite's dependency
// pre-bundler. This implements just the slice of the API RipplePressable
// actually uses: useSharedValue, useAnimatedStyle, withTiming, Easing, and
// Animated.View — enough to render and animate correctly in the browser.
import React, { useRef, useState, useEffect } from 'react';
import { View } from 'react-native';

type TimingConfig = { duration?: number; easing?: (t: number) => number };

class TimingRequest {
  constructor(public toValue: number, public config: TimingConfig = {}, public callback?: (finished: boolean) => void) {}
}

export function withTiming(toValue: number, config?: TimingConfig, callback?: (finished: boolean) => void) {
  return new TimingRequest(toValue, config, callback) as unknown as number;
}

export const Easing = {
  out: (fn: (t: number) => number) => fn,
  in: (fn: (t: number) => number) => fn,
  quad: (t: number) => t * t,
  linear: (t: number) => t,
};

class SharedValue<T> {
  private _value: T;
  private listeners = new Set<() => void>();
  private raf: number | null = null;

  constructor(initial: T) {
    this._value = initial;
  }

  get value(): T {
    return this._value;
  }

  set value(next: T) {
    if (next instanceof TimingRequest) {
      this.animateTo(next);
      return;
    }
    this._value = next;
    this.notify();
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  private animateTo(request: TimingRequest) {
    if (this.raf) cancelAnimationFrame(this.raf);
    const start = this._value as unknown as number;
    const target = request.toValue;
    const duration = request.config.duration ?? 300;
    const startTime = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      this._value = (start + (target - start) * t) as unknown as T;
      this.notify();
      if (t < 1) {
        this.raf = requestAnimationFrame(step);
      } else {
        this.raf = null;
        request.callback?.(true);
      }
    };
    this.raf = requestAnimationFrame(step);
  }
}

export function useSharedValue<T>(initial: T) {
  const ref = useRef<SharedValue<T>>();
  if (!ref.current) ref.current = new SharedValue(initial);
  return ref.current as unknown as { value: T };
}

export function useAnimatedStyle<T>(fn: () => T): T {
  const [, forceRender] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useEffect(() => {
    let raf: number;
    const tick = () => {
      forceRender((n) => n + 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return fnRef.current();
}

const Animated = { View };
export default Animated;
