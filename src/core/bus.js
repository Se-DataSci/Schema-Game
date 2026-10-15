/* Event bus. The UI (DOM) and the Phaser scenes never import each other;
   they talk through named events instead, which keeps the modules independent.
   Events used: start-dive, dive-ended, encounter-open, encounter-closed, act,
   fight-hit, fight-miss, scan-beam, float, cos-changed, base-changed, bay, layout */
const handlers = {};

export const bus = {
  on(event, fn) { (handlers[event] = handlers[event] || []).push(fn); },
  off(event, fn) { handlers[event] = (handlers[event] || []).filter(f => f !== fn); },
  emit(event, ...args) { (handlers[event] || []).slice().forEach(fn => fn(...args)); }
};
