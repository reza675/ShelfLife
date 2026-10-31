/**
 * useNow.js – provides a single shared `now` timestamp updated by ONE setInterval.
 * All pages/components consume this hook; no per-card timers.
 *
 * Uses a module-level interval (not per-component) so multiple hook consumers
 * share the same tick. The interval is cleaned up when the last subscriber unmounts.
 */
import { useState, useEffect } from 'react';
import { TICK_MS } from '../lib/constants.js';

let subscribers = 0;
let intervalId  = null;
let currentNow  = Date.now();
const listeners = new Set();

function tick() {
  currentNow = Date.now();
  listeners.forEach((fn) => fn(currentNow));
}

export function useNow() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const handler = (t) => setNow(t);
    listeners.add(handler);
    subscribers++;

    if (!intervalId) {
      intervalId = setInterval(tick, TICK_MS);
    }

    return () => {
      listeners.delete(handler);
      subscribers--;
      if (subscribers === 0 && intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };
  }, []);

  return now;
}
