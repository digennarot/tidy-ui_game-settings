import { describe, it, expect, vi, beforeEach } from 'vitest';
import $ from 'jquery';

describe('tidy-ui_game-settings', () => {
    beforeEach(async () => {
        // Reset mocks and state
        vi.resetModules();
        vi.clearAllMocks();
        globalThis.Hooks.events = {};

        // Re-import the file to trigger hook registrations for each test
        await import('../src/tidy-ui_game-settings.js');
    });

    it('registers the required hooks', () => {
        expect(globalThis.Hooks.events['renderSettingsConfig']).toBeDefined();
        expect(globalThis.Hooks.events['renderModuleManagement']).toBeDefined();
        expect(globalThis.Hooks.events['init']).toBeDefined();
    });

    it('initializes game settings on init', () => {
        // Call the init hook
        globalThis.Hooks.callAll('init');

        expect(globalThis.game.settings.register).toHaveBeenCalledWith(
            "tidy-ui_game-settings",
            "hideDisableAll",
            expect.any(Object)
        );
    });

    it('modifies the renderModuleManagement UI appropriately', () => {
        const html = $(`
      <form class="form">
        <ul id="module-list">
          <li class="package" data-module-id="test-module-1">
            <h3 class="package-title">Test Module 1</h3>
            <span class="version">1.0.0</span>
            <input type="checkbox" name="test-module-1" checked>
          </li>
          <li class="package" data-module-id="test-module-2">
            <h3 class="package-title">Test Module 2</h3>
            <span class="version">2.0.0</span>
            <input type="checkbox" name="test-module-2">
          </li>
          <li class="package" data-module-id="tidy-ui_game-settings">
            <h3 class="package-title">Tidy UI</h3>
            <input type="checkbox" name="tidy-ui_game-settings" checked>
          </li>
        </ul>
      </form>
    `);

        // Call the hook
        globalThis.Hooks.callAll('renderModuleManagement', null, html);

        // Verify buttons are added
        expect(html.find('.disable-all-modules').length).toBe(1);
        expect(html.find('.enable-all-modules').length).toBe(1);
        expect(html.find('.modules-export').length).toBe(1);
        expect(html.find('.modules-import').length).toBe(1);

        // Verify the disable all button unchecks everything except tidy module
        html.find('.disable-all-modules').trigger('click');
        expect(html.find('input[name="test-module-1"]').prop('checked')).toBe(false);
        expect(html.find('input[name="test-module-2"]').prop('checked')).toBe(false);
        // Tidy UI should stay checked
        expect(html.find('input[name="tidy-ui_game-settings"]').prop('checked')).toBe(true);

        // Verify enable all checks everything
        html.find('.enable-all-modules').trigger('click');
        expect(html.find('input[name="test-module-1"]').prop('checked')).toBe(true);
        expect(html.find('input[name="test-module-2"]').prop('checked')).toBe(true);
        expect(html.find('input[name="tidy-ui_game-settings"]').prop('checked')).toBe(true);
    });

    it('handles the JSON export flow', () => {
        const html = $(`
      <form class="form">
        <ul id="module-list">
          <li class="package" data-module-id="active-mod">
            <h3 class="package-title">Active Mod</h3>
            <span class="version">1.0</span>
            <input type="checkbox" name="active-mod" checked>
          </li>
          <li class="package" data-module-id="inactive-mod">
            <h3 class="package-title">Inactive Mod</h3>
            <span class="version">Version 2.0</span>
            <input type="checkbox" name="inactive-mod">
          </li>
        </ul>
      </form>
    `);

        globalThis.Hooks.callAll('renderModuleManagement', null, html);

        // Click export button
        html.find('.modules-export').trigger('click');

        // Verify export modal text
        const exportText = html.find('#modalIO').val();
        expect(exportText).toContain('Active Modules:');
        expect(exportText).toContain('Active Mod v1.0;');
        expect(exportText).toContain('Inactive Modules:');
        expect(exportText).toContain('Inactive Mod v2.0;');

        // Export options should be visible
        expect(html.find('.export-options').css('display')).not.toBe('none');
    });
});
