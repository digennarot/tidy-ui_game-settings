# Changelog

## 0.1.74

- Manifest URL moved to `releases/latest/download/module.json`; releases attach `module.json` and no longer push to master. Existing installs migrate automatically on their next update
- Release workflow runs the tests before publishing and packages only runtime files
- Added module categories in Manage Modules: a filter bar (PF2e, D&D, system agnostic, other systems, adventures, sounds, visual improvements) with counts, category tags on each module, and per-module overrides for GMs stored in the new `moduleCategories` world setting
- **Changed:** "Check" and "Uncheck" now act only on the modules currently shown (category filter and Foundry's search/active filters); labels updated to match
- Sorting, categories and the hidden "Deactivate All" button now survive Module Management re-renders
- Import now reports how many modules were actually activated and warns about modules that are not installed
- Added missing translations for German, Spanish, Japanese and Traditional Chinese
- Release zip no longer bundles `node_modules`, tests or dev tooling
- Stopped tracking `node_modules` and `coverage` in git
- Fixed import/export modal handlers relying on global selectors
- Prevented duplicate controls when the Module Management window re-renders
- Escaped module ids when applying an import
- Localized import/export notifications
- Corrected import help text (only JSON can be imported) and removed unused translation keys
- Tests now run in CI
- CI actions updated to Node 24 (`actions/checkout@v7`, `actions/setup-node@v7`)
- Documentation now matches the implemented features

## 0.1.73

- Foundry VTT 14 compatibility
- Fixed export button jQuery reference
- Fixed markdown formatting in CHANGELOG

## 0.1.72

- Added comprehensive User Guide and Developer Guide
- Added markdownlint to package scripts and GitHub CI

## 0.1.71

- Foundry VTT v13 compatibility
- Modernized module manifest structure
- Removed deprecated fields (`name`, `scripts`, `minimumCoreVersion`, `compatibleCoreVersion`)
- Added `relationships` object for dependency management
- Changed `scripts` to `esmodules` for ES6 module support
- Added `packMode: nested` for GitHub archive support
- Modernized CSS with logical properties and modern color syntax
- Improved CSS performance and maintainability
- Added Italian language support
- Enhanced author metadata with URL
- Added bugs and changelog URLs

## 0.1.60

- Forge 13 Version fix

## 0.1.51

- Module manager Display fix
- Forge Version fix

## 0.1.5

- DSA display issue fix

## 0.1.4

- Removed settings page modifications due to core layout change
- Exclusive v10

## 0.1.33

- v10 compatibility fix

## 0.1.32

- v10 compatibility

## 0.1.31

- Fixed css for tab display

## 0.1.30

- Module json fix (maybe will fix install pre v9)

## 0.1.29

- v9 compatibility
- Disabled checkboxes are now greyed out
- Script changes for module compatibility

## 0.1.27 / 0.1.28

- TDE/DSA 5 layout fix

## 0.1.26

- TDE/DSA 5 layout fix

## 0.1.25

- Warning on new version changes
- Better worded button names

## 0.1.24

- Compatibility version update
- CSS fix for very long module titles
- Export as text and json files also list inactive modules
- Ability to export JSON files to save active module list
- Ability to import stored JSON list to set active module list
- Legacy option to paste old text format for module list

## 0.1.23

- Spanish translation update
- Fixed scroll position for module settings searchbar
- Fixed search results in module settings search

## 0.1.22

- Taiwanese translation added
- CSS adjustments for buttons

## 0.1.21

- CSS adjustments for more compact module manager

## 0.1.20

- Added Spanish translation. Thanks to José E. Lozano

## 0.1.19

- Added language support
