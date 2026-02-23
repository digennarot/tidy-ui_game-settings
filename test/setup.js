import $ from 'jquery';
import { vi } from 'vitest';

// Expose jQuery globally as expected by Foundry VTT modules
globalThis.$ = globalThis.jQuery = $;
$.fn.sort = Array.prototype.sort;

// Mock Foundry VTT 'Hooks' API
globalThis.Hooks = {
    events: {},
    on: vi.fn((event, callback) => {
        if (!globalThis.Hooks.events[event]) {
            globalThis.Hooks.events[event] = [];
        }
        globalThis.Hooks.events[event].push(callback);
    }),
    once: vi.fn((event, callback) => {
        if (!globalThis.Hooks.events[event]) {
            globalThis.Hooks.events[event] = [];
        }
        // Simple implementation for tests
        globalThis.Hooks.events[event].push(callback);
    }),
    callAll: (event, ...args) => {
        if (globalThis.Hooks.events[event]) {
            for (const callback of globalThis.Hooks.events[event]) {
                callback(...args);
            }
        }
    },
};

// Mock Foundry VTT 'game' object
globalThis.game = {
    i18n: {
        localize: vi.fn((key) => key),
    },
    settings: {
        get: vi.fn().mockImplementation((module, key) => {
            if (module === "tidy-ui_game-settings" && key === "hideDisableAll") return false;
            return false;
        }),
        register: vi.fn(),
    },
};

// Mock Foundry VTT 'ui' object
globalThis.ui = {
    notifications: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
};

// Mock Foundry VTT 'readTextFromFile' and 'saveDataToFile' globally
globalThis.readTextFromFile = vi.fn().mockResolvedValue('');
globalThis.saveDataToFile = vi.fn();
