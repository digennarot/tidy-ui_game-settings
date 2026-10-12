# Tidy UI - Game Settings

A comprehensive Foundry VTT module that enhances the usability and visual clarity of the game settings interface, making configuration management more intuitive and efficient.

## Features

### Reorganized Settings Sidebar

Settings buttons are logically grouped by function, creating a more intuitive navigation structure that reduces confusion and improves workflow efficiency.

### Improved Visual Layout

Enhanced spacing, alignment, and visual hierarchy throughout the settings interface make information easier to scan and interact with. Input fields, buttons, and controls are consistently positioned for better usability.

### Advanced Module Manager

- **Module Categories:** Filter the module list by PF2e, D&D, system agnostic, other systems, adventures, sounds or visual improvements. Categories are detected automatically and GMs can correct them per module
- **Bulk Selection Controls:** "Check" and "uncheck" buttons for the modules currently shown, so you can toggle a whole category at once (Tidy UI itself remains checked for stability)
- **Alphabetical Sorting:** Modules are automatically sorted by display name for easier location
- **Export / Import:** Save your active module list as JSON (or copy it as text for sharing) and restore it later

### Enhanced Interactions

Click directly on setting titles to toggle their associated checkboxes—no need to precisely target small checkbox areas.

## Documentation

- [User Guide](docs/USER_GUIDE.md): Detailed instructions on module features, export/import management, and UI changes.
- [Developer Guide](docs/DEVELOPER_GUIDE.md): Technical overview covering architecture, hooks, state management, and tests.

## Compatibility

- **Minimum Foundry Version:** v13
- **Verified Foundry Version:** v14
- **Supported Languages:** English, Deutsch, Español, 正體中文, 日本語, Italiano

## Installation

### Method 1: Via Manifest URL

1. Open Foundry VTT and navigate to the **Configuration and Setup** screen
2. Select the **Add-on Modules** tab
3. Click **Install Module**
4. Paste the following URL into the **Manifest URL** field:

   ```text
   https://github.com/digennarot/tidy-ui_game-settings/releases/latest/download/module.json
   ```

5. Click **Install**

### Method 2: Via Module Browser

1. In Foundry VTT, open the **Add-on Modules** tab
2. Search for "Tidy UI - Game Settings"
3. Click **Install**

## Preview

### Reorganized Sidebar

![Sidebar](/preview/sidebar.jpg)

### Module Management Interface

![Module Management](/preview/module-management-compressed.jpg)

### Core Settings View

![Settings - Core](/preview/core.jpg)

### System Settings View

![Settings - System](/preview/system.jpg)

### Collapsible Module Settings View

![Settings - Modules (compressed)](/preview/mod_compressed.jpg)

### Expanded Module Settings

![Settings - Modules (expanded)](/preview/mod-expanded.jpg)

## Support

- **Issues & Bug Reports:** [GitHub Issues](https://github.com/digennarot/tidy-ui_game-settings/issues)
- **Changelog:** [View Changelog](https://github.com/digennarot/tidy-ui_game-settings/blob/master/CHANGELOG.md)

## Credits

**Author:** [digennarot](https://github.com/digennarot)

## License

This project is licensed under the ISC License.

---

**Note:** This module was formerly known as "FVTT UII - Game Settings."
