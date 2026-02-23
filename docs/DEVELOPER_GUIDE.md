# Tidy UI - Game Settings: Developer Guide

This guide is intended for developers who wish to contribute to or understand the inner workings of the `tidy-ui_game-settings` module.

## Architecture Overview

The module consists primarily of a single JavaScript file (`src/tidy-ui_game-settings.js`) and an accompanying CSS file (`src/styles/tidy-ui_game-settings.css`). It operates by hooking into Core Foundry VTT render events, leveraging jQuery for DOM manipulation.

### Key Hooks Utilized

1. **`renderSettingsConfig`:**
   - Fires when the "Configure Settings" window is opened.
   - **DOM Changes:**
     - Iterates through the settings elements and wraps groups into `<section class="module-settings-wrapper">` for the collapsible accordion styling.
     - Wraps label text in `<span>` tags to facilitate the expanded click targets that trigger sibling checkboxes.

2. **`renderModuleManagement`:**
   - Fires when the "Manage Modules" window is opened.
   - **DOM Changes:**
     - Injects custom UI buttons: "Enable All", "Disable All", "Export", and "Import".
     - Injects a hidden modal (`#importExportModal`) to display the import/export UI.
     - Enforces alphabetical sorting parsing the `.package-title` elements and moving `.package` list items accordingly.
   - **Import/Export Logic:**
     - Generates JSON structures locally by parsing the checked/unchecked state of inputs on the page.
     - Exposes the clipboard API usage to copy readable lists.
     - Handles file upload and JSON parsing to restore state by selecting the relevant checkboxes in the DOM.

3. **`init`:**
   - Fires during Foundry VTT initialization.
   - Registers the `hideDisableAll` game setting.

## Development Workflow

### Prerequisites

- Node.js installed.
- Understanding of Foundry VTT module structure and hooks.
- Familiarity with jQuery for DOM interactions.

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/digennarot/tidy-ui_game-settings.git
cd tidy-ui_game-settings
npm install
```

### Running Tests

The project relies on `vitest` in a `jsdom` environment to mock the DOM and the `Hooks` API provided by Foundry VTT.

Run the test suite:

```bash
npm run test
```

Generate test coverage:

```bash
npm run coverage
```

Watch mode for active development:

```bash
npm run test:watch
```

### Mocking the Foundry API

During testing, global variables like `Hooks`, `game`, `ui`, and DOM manipulation libraries like `$` (jQuery) must be mocked. Refer to `test/setup.js` and `test/tidy-ui_game-settings.test.js` to see how the testing environment simulates the VTT initialization and render pipeline.

## Build and Releases

Automated releases are handled via GitHub Actions in `.github/workflows/release.yml`. When adding new features, increment the `"version"` field inside `module.json` and `package.json` and ensure tests pass properly.
