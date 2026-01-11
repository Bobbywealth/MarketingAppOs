import { Capacitor } from "@capacitor/core";

/**
 * True when running inside a native iOS/Android Capacitor shell.
 * In normal web/PWA usage this will be false.
 */
export function isNativeApp(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

