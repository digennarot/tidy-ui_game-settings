# Tidy UI - Game Settings: User Guide

Tidy UI - Game Settings is a module for Foundry VTT that enhances the game settings and module management interfaces. This guide will help you understand and utilize the various features provided by the module.

## Core Features

The module automatically reorganizes the layout of the "Settings" tab and "Manage Modules" window for improved usability and visual clarity.

### Module Management Simplification

When you open the **Manage Modules** window, you will notice several new interaction options at the top:

1. **Check / Uncheck Shown Modules Buttons:** These act only on the modules currently shown, after the category filter and Foundry's own search and active/inactive filters. With the **All** category and no search, they affect every module.
   - **Check:** Enables the shown modules.
   - **Uncheck:** Disables the shown modules *except* for "Tidy UI - Game Settings" and "Tidy UI" (if installed). This acts as a safe reset, ensuring you do not lock yourself out of the Tidy UI interface.

2. **Hide "Disable All" Button:**
   - If you frequently misclick the default Foundry VTT "Deactivate All" button and wish to hide it, Tidy UI offers a setting for that.
   - Go to **Game Settings > Configure Settings > Tidy UI - Game Settings** and check "**Hide 'Disable All Modules' Button**".

### Module Categories

A row of category buttons above the module list filters it: **All**, then the system group (**PF2e**, **D&D**, **System agnostic**, **Other systems**) and the content group (**Adventures**, **Sounds**, **Visual improvements**). Each button shows how many modules it contains, and each module shows its categories as coloured tags. A module can belong to several categories.

Click several buttons to combine them, and click an active button again to turn it off:

- Buttons in the same group add up: **PF2e** + **D&D** shows the modules for either system.
- Buttons in different groups narrow down: **PF2e** + **Adventures** shows only PF2e adventures.
- **All** clears the selection.

The number on each button tells how many modules you would see by turning it on with the current selection.

Categories are detected automatically:

- **PF2e / D&D / Other systems:** from the systems the module declares in its manifest. Modules that declare no system are matched by keywords such as "pf2e" or "5e" in their name and description, and otherwise count as **System agnostic**.
- **Adventures:** the module is listed under *Adventures* on [foundryvtt.com](https://foundryvtt.com/packages/tag/adventures) and ships Scene or Adventure compendiums, contains Adventure compendiums, or its name mentions an adventure or one-shot.
- **Sounds:** the module is listed under *Audio Improvements* on [foundryvtt.com](https://foundryvtt.com/packages/tag/audio), contains Playlist compendiums, or its name mentions sounds, music or ambience.
- **Visual improvements:** the module is listed under *Visual Effects* on [foundryvtt.com](https://foundryvtt.com/packages/tag/visuals), or its name or description mentions visual effects, animations, lighting, particles and similar.

The foundryvtt.com categories are chosen by each module's author and are bundled with Tidy UI and refreshed monthly. No network request is made while you play.

Detection is a best guess. A GM can fix it with the tag icon next to a module's tags: toggle the categories that apply, or click **Reset to automatic** to go back to detection. These choices are saved for the world.

### Settings Sidebar Overhaul

In the **Configure Settings** menu:

- Each module's settings are grouped into their own section.
- **Easy Checkboxes:** You can click directly on a setting's label to toggle its associated checkbox, providing a larger click target.

## Module Import/Export

The module allows you to easily share and backup your active module configuration using the Export and Import features located in the **Manage Modules** window.

### Exporting Your Configuration

1. Open the **Manage Modules** window.
2. Click the **Export** button (indicated by a file export icon) at the top.
3. A modal will open displaying the current state of both your **Active** and **Inactive** modules.
4. **Options:**
   - **To Clipboard:** Copies the formatted text list of active and inactive modules to your clipboard, useful for sharing in text form on Discord or forums.
   - **To File:** Downloads a `moduleList.json` file. This file contains the structured JSON data necessary to import this exact module configuration into another game or server.

### Importing a Configuration

*Warning: Importing a configuration will overwrite your currently active modules. Ensure you have backed up your current configuration if needed.*

1. Open the **Manage Modules** window.
2. Click the **Import** button (indicated by a file import icon) at the top.
3. **Options:**
   - **From File:** Select a `moduleList.json` file you previously generated via the Export to File option.
   - **Activate:** If you already copied the JSON output from an export, you can paste it into the provided text area and click "Activate".
4. The module will parse the data and automatically check all the modules listed in the JSON's `activeModules` array, unchecking everything else.
5. You **must click "Save Module Settings"** at the bottom of the window to apply the changes.

---

### Troubleshooting

- **Import Error "Missing activeModules array":** The data you provided (either via file or paste) is missing the structural requirements generated by an official Tidy UI export. Ensure you are importing an unmodified `moduleList.json`.
- **Importing text vs JSON:** The text list generated by "To Clipboard" is for readability and human sharing. It cannot be used in the Paste area for "Activate". You must use the raw JSON text for pasting, or use the "From File" option with a generated JSON file.
