import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import $ from 'jquery';

// Fixed official foundryvtt.com categories, so tests do not depend on the scraped data
vi.mock('../src/data/package-categories.js', () => ({
    OFFICIAL_CATEGORIES: {
        adventures: ['tagged-tool', 'tagged-adventure'],
        sounds: [],
        visual: ['tagged-visual'],
    },
}));

describe('tidy-ui_game-settings', () => {
    beforeEach(async () => {
        // Reset mocks and state
        vi.resetModules();
        vi.clearAllMocks();
        globalThis.Hooks.events = {};

        // Re-import the file to trigger hook registrations for each test
        await import('../src/tidy-ui_game-settings.js');
    });

    afterEach(() => {
        delete globalThis.game.modules;
        delete globalThis.game.user;
        globalThis.game.settings.get.mockImplementation(() => false);
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

    it('does not inject controls twice on re-render', () => {
        const html = $(`<form class="form"><ul id="module-list"></ul></form>`);

        globalThis.Hooks.callAll('renderModuleManagement', null, html);
        globalThis.Hooks.callAll('renderModuleManagement', null, html);

        expect(html.find('.enhanced-module-management').length).toBe(1);
        expect(html.find('#importExportModal').length).toBe(1);
    });

    it('activates modules from pasted JSON', () => {
        const html = $(`
      <form class="form">
        <ul id="module-list">
          <li class="package" data-module-id="mod-a">
            <h3 class="package-title">Mod A</h3>
            <input type="checkbox" name="mod-a" checked>
          </li>
          <li class="package" data-module-id="mod-b">
            <h3 class="package-title">Mod B</h3>
            <input type="checkbox" name="mod-b">
          </li>
        </ul>
      </form>
    `);

        globalThis.Hooks.callAll('renderModuleManagement', null, html);

        html.find('.modules-import').trigger('click');
        html.find('#modalIO').val(JSON.stringify({ activeModules: [{ id: 'mod-b' }, { id: 'bad"id' }] }));
        html.find('.modules-import-confirm').trigger('click');

        expect(html.find('input[name="mod-a"]').prop('checked')).toBe(false);
        expect(html.find('input[name="mod-b"]').prop('checked')).toBe(true);
        expect(globalThis.ui.notifications.info).toHaveBeenCalledWith('TidyUI.activated');
        expect(globalThis.game.i18n.format).toHaveBeenCalledWith('TidyUI.activated', { count: 1 });
        expect(globalThis.ui.notifications.warn).toHaveBeenCalledWith('TidyUI.missingModules');
        expect(globalThis.game.i18n.format).toHaveBeenCalledWith('TidyUI.missingModules', { count: 1 });
    });

    describe('module categories', () => {
        const manifests = {
            'pf2e-adventure': { title: 'Abomination Vaults', relationships: { systems: new Set([{ id: 'pf2e' }]) }, packs: new Set([{ type: 'Adventure' }]) },
            'dnd-tool': { title: 'Midi QOL', relationships: { systems: new Set([{ id: 'dnd5e' }]) }, packs: new Set() },
            'ambience': { title: 'Ambient Soundscapes', relationships: { systems: new Set() }, packs: new Set([{ type: 'Playlist' }]) },
            'swade-tool': { title: 'Savage Helper', relationships: { systems: new Set([{ id: 'swade' }]) }, packs: new Set() },
            'tidy-ui': { title: 'Tidy UI', description: 'A cleaner user interface with active effects support', relationships: { systems: new Set() }, packs: new Set() },
            'tagged-visual': { title: 'Plain Name', relationships: { systems: new Set() }, packs: new Set() },
            'tagged-tool': { title: 'Name Generator', relationships: { systems: new Set() }, packs: new Set([{ type: 'RollTable' }]) },
            'tagged-adventure': { title: 'The Lost Mine', relationships: { systems: new Set() }, packs: new Set([{ type: 'Scene' }]) },
            'fancy-fx': { title: 'Sequencer', description: '<p>Play visual effects on the canvas</p>', relationships: { systems: new Set() }, packs: new Set() },
        };

        const buildHtml = () => $(`
      <form class="form">
        <ul id="module-list">
          ${Object.entries(manifests).map(([id, m]) => `
          <li class="package" data-module-id="${id}">
            <h3 class="package-title">${m.title}</h3>
            <input type="checkbox" name="${id}">
          </li>`).join('')}
        </ul>
      </form>
    `);

        const categoriesOf = (html, id) =>
            html.find(`.package[data-module-id="${id}"]`).attr('data-tidy-categories').split(' ');

        beforeEach(() => {
            globalThis.game.modules = { get: (id) => manifests[id] };
            globalThis.game.user = { isGM: true };
        });

        it('detects categories from manifests', () => {
            const html = buildHtml();
            globalThis.Hooks.callAll('renderModuleManagement', null, html);

            expect(categoriesOf(html, 'pf2e-adventure')).toEqual(['pf2e', 'adventures']);
            expect(categoriesOf(html, 'dnd-tool')).toEqual(['dnd']);
            expect(categoriesOf(html, 'ambience')).toEqual(['agnostic', 'sounds']);
            expect(categoriesOf(html, 'fancy-fx')).toEqual(['agnostic', 'visual']);
            expect(categoriesOf(html, 'swade-tool')).toEqual(['other']);
            // Official foundryvtt.com categories, no keyword in the manifest
            expect(categoriesOf(html, 'tagged-visual')).toEqual(['agnostic', 'visual']);
            expect(categoriesOf(html, 'tagged-adventure')).toEqual(['agnostic', 'adventures']);
            // Tagged Adventures but ships no scenes or adventures
            expect(categoriesOf(html, 'tagged-tool')).toEqual(['agnostic']);
            expect(categoriesOf(html, 'tidy-ui')).toEqual(['agnostic']);
            expect(html.find('.tidy-category[data-category="agnostic"] .tidy-category-count').text()).toBe('6');
        });

        it('filters the list and limits check all to the visible category', () => {
            const html = buildHtml();
            globalThis.Hooks.callAll('renderModuleManagement', null, html);

            html.find('.tidy-category[data-category="pf2e"]').trigger('click');
            expect(html.find('.package:not(.tidy-filtered-out)').length).toBe(1);

            html.find('.enable-all-modules').trigger('click');
            expect(html.find('input[name="pf2e-adventure"]').prop('checked')).toBe(true);
            expect(html.find('input[name="dnd-tool"]').prop('checked')).toBe(false);

            html.find('.tidy-category[data-category="all"]').trigger('click');
            expect(html.find('.tidy-filtered-out').length).toBe(0);
        });

        it('saves manual category overrides', async () => {
            const html = buildHtml();
            globalThis.Hooks.callAll('renderModuleManagement', null, html);

            const pkg = html.find('.package[data-module-id="dnd-tool"]');
            pkg.find('.tidy-category-edit').trigger('click');
            pkg.find('.tidy-category-option[data-category="visual"]').trigger('click');

            expect(categoriesOf(html, 'dnd-tool')).toEqual(['dnd', 'visual']);
            await vi.waitFor(() =>
                expect(globalThis.game.settings.set).toHaveBeenCalledWith(
                    'tidy-ui_game-settings',
                    'moduleCategories',
                    { 'dnd-tool': ['dnd', 'visual'] }
                )
            );
        });
        it('combines filters: OR within a group, AND across groups', () => {
            const html = buildHtml();
            globalThis.Hooks.callAll('renderModuleManagement', null, html);
            const click = (category) => html.find(`.tidy-category[data-category="${category}"]`).trigger('click');
            const shown = () => html.find('.package:not(.tidy-filtered-out)').map((i, el) => el.dataset.moduleId).get().sort();

            click('pf2e');
            click('dnd');
            expect(shown()).toEqual(['dnd-tool', 'pf2e-adventure']);

            click('adventures');
            expect(shown()).toEqual(['pf2e-adventure']);
            expect(html.find('.tidy-category.active').length).toBe(3);

            // Clicking an active button deselects it
            click('adventures');
            expect(shown()).toEqual(['dnd-tool', 'pf2e-adventure']);

            click('all');
            expect(html.find('.tidy-filtered-out').length).toBe(0);
            expect(html.find('.tidy-category.active').attr('data-category')).toBe('all');
        });

        it('counts what each button would show with the current selection', () => {
            const html = buildHtml();
            globalThis.Hooks.callAll('renderModuleManagement', null, html);
            const count = (category) => html.find(`.tidy-category[data-category="${category}"] .tidy-category-count`).text();

            expect(count('adventures')).toBe('2');
            html.find('.tidy-category[data-category="pf2e"]').trigger('click');
            expect(count('adventures')).toBe('1');
            // Same group as the selection: still the full count
            expect(count('dnd')).toBe('1');
            expect(count('all')).toBe(String(html.find('.package').length));
        });

        it('ignores unknown categories in saved overrides', () => {
            globalThis.game.settings.get.mockImplementation((module, key) =>
                key === 'moduleCategories' ? { 'dnd-tool': ['visuals', 'sounds', 'dnd'] } : false
            );
            const html = buildHtml();
            globalThis.Hooks.callAll('renderModuleManagement', null, html);

            expect(categoriesOf(html, 'dnd-tool')).toEqual(['dnd', 'sounds']);
            expect(html.find('.tidy-category-count').text()).not.toContain('NaN');
        });

        it('skips modules hidden by Foundry when checking all', () => {
            const html = buildHtml();
            globalThis.Hooks.callAll('renderModuleManagement', null, html);

            html.find('.package[data-module-id="dnd-tool"]')[0].hidden = true;
            html.find('.enable-all-modules').trigger('click');

            expect(html.find('input[name="dnd-tool"]').prop('checked')).toBe(false);
            expect(html.find('input[name="ambience"]').prop('checked')).toBe(true);
        });

        it('rebuilds categories for a re-rendered package list and keeps the filter', () => {
            const html = buildHtml();
            globalThis.Hooks.callAll('renderModuleManagement', null, html);
            html.find('.tidy-category[data-category="sounds"]').trigger('click');

            // ApplicationV2 keeps the root element but replaces the package list
            html.find('#module-list').replaceWith(buildHtml().find('#module-list'));
            globalThis.Hooks.callAll('renderModuleManagement', null, html);

            expect(html.find('.tidy-category-filter').length).toBe(1);
            expect(html.find('.tidy-category.active').attr('data-category')).toBe('sounds');
            expect(html.find('.package:not(.tidy-filtered-out)').length).toBe(1);
            expect(html.find('.package').first().attr('data-module-id')).toBe('pf2e-adventure');
        });

        it('keeps every override when edits are made quickly', async () => {
            const html = buildHtml();
            globalThis.Hooks.callAll('renderModuleManagement', null, html);

            for (const id of ['dnd-tool', 'ambience']) {
                const pkg = html.find(`.package[data-module-id="${id}"]`);
                pkg.find('.tidy-category-edit').trigger('click');
                pkg.find('.tidy-category-option[data-category="visual"]').trigger('click');
            }
            await vi.waitFor(() => expect(globalThis.game.settings.set).toHaveBeenCalledTimes(2));

            expect(globalThis.game.settings.set).toHaveBeenLastCalledWith(
                'tidy-ui_game-settings',
                'moduleCategories',
                { 'dnd-tool': ['dnd', 'visual'], ambience: ['agnostic', 'sounds', 'visual'] }
            );
        });

        it('hides the category editor from non-GM users', () => {
            globalThis.game.user = { isGM: false };
            const html = buildHtml();
            globalThis.Hooks.callAll('renderModuleManagement', null, html);

            expect(html.find('.tidy-tag').length).toBeGreaterThan(0);
            expect(html.find('.tidy-category-edit').length).toBe(0);
        });
    });

    it('rejects non-JSON paste on import', () => {
        const html = $(`<form class="form"><ul id="module-list"></ul></form>`);

        globalThis.Hooks.callAll('renderModuleManagement', null, html);

        html.find('.modules-import').trigger('click');
        html.find('#modalIO').val('Active Modules:\n----------\nMod A v1.0;');
        html.find('.modules-import-confirm').trigger('click');

        expect(globalThis.ui.notifications.error).toHaveBeenCalledWith('TidyUI.errorPasteFormat');
    });
});
