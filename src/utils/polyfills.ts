// Polyfills for React Native and web compatibility
import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';

// Global polyfills for web environment
if (typeof global === 'undefined') {
  if (typeof window !== 'undefined') {
    (window as any).global = window;
  }
}

// Buffer polyfill
if (typeof Buffer === 'undefined') {
  try {
    const { Buffer } = require('@craftzdog/react-native-buffer');
    (global as any).Buffer = Buffer;
  } catch (error) {
    console.warn('Buffer polyfill not available:', error);
  }
}

// Process polyfill
if (typeof process === 'undefined') {
  try {
    if (Platform.OS === 'web') {
      const process = require('process/browser');
      (global as any).process = process;
    } else {
      // Mobile fallback
      (global as any).process = {
        env: {},
        nextTick: (fn: Function) => setTimeout(fn, 0),
        version: '',
        platform: Platform.OS,
      };
    }
  } catch (error) {
    console.warn('Process polyfill not available:', error);
    // Minimal fallback
    (global as any).process = {
      env: {},
      nextTick: (fn: Function) => setTimeout(fn, 0),
      version: '',
      platform: Platform.OS,
    };
  }
}

// Crypto polyfill for React Native
if (typeof global.crypto === 'undefined') {
  try {
    if (typeof window !== 'undefined' && window.crypto) {
      // Use native crypto on web
      global.crypto = window.crypto;
    } else {
      // Use expo-crypto on mobile
      try {
        const expoCrypto = require('expo-crypto');
        global.crypto = {
          getRandomValues: (arr: any) => {
            try {
              const randomBytes = expoCrypto.getRandomBytes(arr.length);
              for (let i = 0; i < arr.length; i++) {
                arr[i] = randomBytes[i];
              }
              return arr;
            } catch (error) {
              // Fallback to Math.random
              for (let i = 0; i < arr.length; i++) {
                arr[i] = Math.floor(Math.random() * 256);
              }
              return arr;
            }
          },
          randomUUID: () => {
            try {
              return expoCrypto.randomUUID();
            } catch (error) {
              return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
              });
            }
          },
        } as any;
      } catch (error) {
        console.warn('expo-crypto not available, using fallback');
        // Minimal crypto fallback
        global.crypto = {
          getRandomValues: (arr: any) => {
            for (let i = 0; i < arr.length; i++) {
              arr[i] = Math.floor(Math.random() * 256);
            }
            return arr;
          },
          randomUUID: () => {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
              const r = Math.random() * 16 | 0;
              const v = c === 'x' ? r : (r & 0x3 | 0x8);
              return v.toString(16);
            });
          },
        } as any;
      }
    }
  } catch (e) {
    console.warn('Crypto polyfill not available:', e);
    // Minimal crypto fallback
    global.crypto = {
      getRandomValues: (arr: any) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      },
      randomUUID: () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      },
    } as any;
  }
}

// TextEncoder/TextDecoder polyfills
if (typeof global.TextEncoder === 'undefined') {
  try {
    const textEncoding = require('text-encoding');
    global.TextEncoder = textEncoding.TextEncoder;
    global.TextDecoder = textEncoding.TextDecoder;
  } catch (e) {
    console.warn('TextEncoder/TextDecoder polyfill not available:', e);
    // Minimal fallback
    global.TextEncoder = class {
      encode(str: string) {
        return new Uint8Array(str.split('').map(c => c.charCodeAt(0)));
      }
    } as any;
    global.TextDecoder = class {
      decode(arr: Uint8Array) {
        return String.fromCharCode(...Array.from(arr));
      }
    } as any;
  }
}

// Basic crypto polyfill for web (minimal implementation)
if (typeof crypto === 'undefined' && typeof window !== 'undefined') {
  try {
    // Use native Web Crypto API if available
    if (window.crypto && window.crypto.getRandomValues) {
      (global as any).crypto = window.crypto;
    } else {
      // Minimal fallback
      (global as any).crypto = {
        getRandomValues: (arr: any) => {
          for (let i = 0; i < arr.length; i++) {
            arr[i] = Math.floor(Math.random() * 256);
          }
          return arr;
        }
      };
    }
  } catch (error) {
    console.warn('Crypto polyfill not available:', error);
  }
}

// TextEncoder/TextDecoder polyfill for older environments
if (typeof TextEncoder === 'undefined') {
  try {
    const { TextEncoder, TextDecoder } = require('util');
    (global as any).TextEncoder = TextEncoder;
    (global as any).TextDecoder = TextDecoder;
  } catch (error) {
    console.warn('TextEncoder/TextDecoder polyfill not available:', error);
  }
}

// Fetch polyfill for React Native
if (typeof fetch === 'undefined') {
  try {
    const fetch = require('node-fetch');
    (global as any).fetch = fetch;
  } catch (error) {
    console.warn('Fetch polyfill not available:', error);
  }
}

// WebSocket polyfill for React Native
if (typeof WebSocket === 'undefined' && typeof window === 'undefined') {
  try {
    const WebSocket = require('ws');
    (global as any).WebSocket = WebSocket;
  } catch (error) {
    console.warn('WebSocket polyfill not available:', error);
  }
}

// URL polyfill
if (typeof URL === 'undefined') {
  try {
    const { URL, URLSearchParams } = require('url');
    (global as any).URL = URL;
    (global as any).URLSearchParams = URLSearchParams;
  } catch (error) {
    console.warn('URL polyfill not available:', error);
  }
}

// Console polyfill for environments without console
if (typeof console === 'undefined') {
  (global as any).console = {
    log: () => {},
    warn: () => {},
    error: () => {},
    info: () => {},
    debug: () => {},
  };
}

// Performance polyfill
if (typeof performance === 'undefined') {
  (global as any).performance = {
    now: () => Date.now(),
  };
}

// Export a function to initialize all polyfills
export const initializePolyfills = () => {
  console.log('🔧 Polyfills initialized for web compatibility');
};

// Auto-initialize polyfills
initializePolyfills();

export default initializePolyfills;
