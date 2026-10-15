/* Picks the game version. One codebase, two profiles:
   "mobile" (smaller zones, thumb-stick) and "full" (bigger zones, keyboard, mini-map, sonar).
   Players can override the automatic choice in the Dive map settings. */
import { CFG } from "../../config/config.js";
import { S } from "./state.js";
export function detectedVersion() {
  const coarse = window.matchMedia && matchMedia("(pointer: coarse)").matches;
  const small = Math.min(screen.width, screen.height) < 820;
  return coarse && small ? "mobile" : "full";
}

export const version = () => (S.settings.version === "auto" ? detectedVersion() : S.settings.version);
export const profile = () => CFG.profiles[version()];
export const isTouch = () => window.matchMedia && matchMedia("(pointer: coarse)").matches;

/* Wide windows dock the PDA panel on the right instead of the bottom. */
export const dockedLayout = () => window.innerWidth >= 900;
