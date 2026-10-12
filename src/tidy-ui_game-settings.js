const MODULE_ID = "tidy-ui_game-settings";

// Module categories in display order; "all" is the unfiltered view
const CATEGORIES = ["all", "pf2e", "dnd", "agnostic", "other", "adventures", "sounds", "visual"];

// System keywords are matched against id, title and description
const PF2E_PATTERN = /\b(pf2e?|pathfinder 2e?|pathfinder second edition)\b/i;
const DND_PATTERN = /\b(dnd5e|dnd|d&d|5e|dungeons (?:&|and) dragons)\b/i;
// Content keywords are matched against id and title only, descriptions mention them too casually
const ADVENTURE_PATTERN = /\b(adventures?|one-?shots?)\b/i;
const SOUND_PATTERN = /\b(sounds?|audio|music|ambien(?:t|ce)|playlists?|sfx|soundscapes?|soundboard)\b/i;
// Visual keywords are specific enough to also check the description
const VISUAL_PATTERN = /\b(visuals?|visual effects|vfx|animations?|animated|particles?|lighting|weather effects|shaders?|dice so nice|token magic|jb2a)\b/i;

// Guess a module's categories from its manifest, falling back to the text shown in the list
function detectCategories(moduleId, packageEl) {
  const mod = game.modules?.get?.(moduleId);
  const systems = [...(mod?.relationships?.systems ?? [])].map((s) => String(s?.id ?? s));
  const packTypes = [...(mod?.packs ?? [])].map((p) => p?.type);
  const title = `${moduleId} ${mod?.title ?? packageEl.find(".package-title").first().text()}`;
  const description = (mod?.description ?? packageEl.find(".package-description").text()).replace(/<[^>]*>/g, " ");
  const text = `${title} ${description}`;

  const categories = new Set();

  // Trust declared systems; only guess from the text when none are declared
  if (systems.length) {
    if (systems.includes("pf2e")) categories.add("pf2e");
    if (systems.some((id) => id.startsWith("dnd"))) categories.add("dnd");
    if (systems.some((id) => id !== "pf2e" && !id.startsWith("dnd"))) categories.add("other");
  } else {
    if (PF2E_PATTERN.test(text)) categories.add("pf2e");
    if (DND_PATTERN.test(text)) categories.add("dnd");
    if (!categories.size) categories.add("agnostic");
  }

  if (packTypes.includes("Adventure") || ADVENTURE_PATTERN.test(title)) categories.add("adventures");
  if (packTypes.includes("Playlist") || SOUND_PATTERN.test(title)) categories.add("sounds");
  if (VISUAL_PATTERN.test(text)) categories.add("visual");

  return [...categories];
}

// Local copy of the saved overrides, so quick successive edits never read a stale setting
let categoryOverrides = null;
let pendingSaves = Promise.resolve();
let pendingSaveCount = 0;

function loadCategoryOverrides() {
  // Keep the local copy while a save is in flight, the setting is not updated yet
  if (!categoryOverrides || !pendingSaveCount) {
    categoryOverrides = { ...(game.settings.get(MODULE_ID, "moduleCategories") || {}) };
  }
  return categoryOverrides;
}

// Saves are chained so they reach the server in the order they were made
function saveCategoryOverrides() {
  const snapshot = { ...categoryOverrides };
  pendingSaveCount++;
  pendingSaves = pendingSaves
    .then(() => game.settings.set(MODULE_ID, "moduleCategories", snapshot))
    .catch((err) => {
      console.error("Tidy UI | Could not save module categories:", err);
      ui.notifications.error(game.i18n.localize("TidyUI.errorSaveCategories"));
    })
    .finally(() => pendingSaveCount--);
  return pendingSaves;
}

function categoryLabel(category) {
  return game.i18n.localize(`TidyUI.category.${category}`);
}

// Packages hidden by Foundry's own search or active/inactive filter
function isHiddenByFoundry(el) {
  return el.hidden || el.classList.contains("hidden") || el.style.display === "none";
}

// Add category badges, a per-module category editor and a filter bar to the module list.
// Runs on every render, rebuilding against the freshly rendered package list.
function setupModuleCategories($html, form) {
  const packages = $html.find("#module-list li.package, .package-list li.package");
  const overrides = loadCategoryOverrides();
  // Only GMs can write the world setting holding the overrides
  const canEdit = game.user?.isGM ?? false;

  const previousBar = form.find(".tidy-category-filter");
  let activeFilter = previousBar.find(".tidy-category.active").attr("data-category") || "all";
  previousBar.remove();
  packages.find(".tidy-category-tags").remove();
  packages.children(".tidy-category-editor").remove();

  const filterBar = $('<nav class="tidy-category-filter"></nav>');
  for (const category of CATEGORIES) {
    filterBar.append(
      `<button type="button" class="tidy-category" data-category="${category}">${categoryLabel(
        category
      )} <span class="tidy-category-count"></span></button>`
    );
  }
  form.find(".enhanced-module-management").after(filterBar);

  // Categories per package element, kept in sync with the data-tidy-categories attribute
  const categoryMap = new Map();

  function moduleIdOf(packageEl) {
    return packageEl.attr("data-module-id") || packageEl.find('input[type="checkbox"]').attr("name");
  }

  function setCategories(packageEl, categories) {
    categoryMap.set(packageEl[0], categories);
    packageEl.attr("data-tidy-categories", categories.join(" "));

    const tags = packageEl.find(".tidy-category-tags").empty();
    for (const category of categories) {
      tags.append(`<span class="tidy-tag tidy-tag-${category}">${categoryLabel(category)}</span>`);
    }
    if (canEdit) {
      tags.append(
        `<a class="tidy-category-edit" title="${game.i18n.localize(
          "TidyUI.editCategories"
        )}"><i class="fas fa-tags"></i></a>`
      );
    }
  }

  function refreshFilter() {
    const counts = Object.fromEntries(CATEGORIES.map((category) => [category, 0]));
    counts.all = packages.length;

    for (const el of packages) {
      const categories = categoryMap.get(el);
      for (const category of categories) counts[category]++;
      el.classList.toggle(
        "tidy-filtered-out",
        activeFilter !== "all" && !categories.includes(activeFilter)
      );
    }

    filterBar.find(".tidy-category").each(function () {
      const category = this.getAttribute("data-category");
      this.classList.toggle("active", category === activeFilter);
      $(this).find(".tidy-category-count").text(counts[category]);
    });
  }

  packages.each(function () {
    const packageEl = $(this);
    const tags = $('<span class="tidy-category-tags"></span>');
    const title = packageEl.find(".package-title").first();
    if (title.length) {
      title.after(tags);
    } else {
      packageEl.prepend(tags);
    }

    const moduleId = moduleIdOf(packageEl);
    const override = overrides[moduleId];
    setCategories(packageEl, Array.isArray(override) ? override : detectCategories(moduleId, packageEl));
  });

  filterBar.on("click", ".tidy-category", function (e) {
    e.preventDefault();
    activeFilter = $(this).attr("data-category");
    refreshFilter();
  });

  function saveOverride(packageEl, categories) {
    const moduleId = moduleIdOf(packageEl);
    if (categories) {
      categoryOverrides[moduleId] = categories;
    } else {
      delete categoryOverrides[moduleId];
    }
    saveCategoryOverrides();
    setCategories(packageEl, categories ?? detectCategories(moduleId, packageEl));
    refreshFilter();
  }

  packages.off(".tidyCategories");
  if (canEdit) {
    // Toggle the inline category editor of a module
    packages.on("click.tidyCategories", ".tidy-category-edit", function (e) {
      e.preventDefault();
      e.stopPropagation();
      const packageEl = $(this).closest(".package");
      const existing = packageEl.children(".tidy-category-editor");
      if (existing.length) {
        existing.remove();
        return;
      }

      const editor = $('<div class="tidy-category-editor"></div>');
      const selected = categoryMap.get(packageEl[0]);
      for (const category of CATEGORIES.slice(1)) {
        editor.append(
          `<button type="button" class="tidy-category-option" data-category="${category}" aria-pressed="${selected.includes(
            category
          )}">${categoryLabel(category)}</button>`
        );
      }
      editor.append(
        `<button type="button" class="tidy-category-reset">${game.i18n.localize(
          "TidyUI.resetCategories"
        )}</button>`
      );
      packageEl.append(editor);
    });

    packages.on("click.tidyCategories", ".tidy-category-option", function (e) {
      e.preventDefault();
      e.stopPropagation();
      const button = $(this);
      button.attr("aria-pressed", button.attr("aria-pressed") !== "true");
      const categories = button
        .parent()
        .find('.tidy-category-option[aria-pressed="true"]')
        .map((i, el) => el.getAttribute("data-category"))
        .get();
      saveOverride(button.closest(".package"), categories);
    });

    packages.on("click.tidyCategories", ".tidy-category-reset", function (e) {
      e.preventDefault();
      e.stopPropagation();
      const packageEl = $(this).closest(".package");
      packageEl.children(".tidy-category-editor").remove();
      saveOverride(packageEl, null);
    });
  }

  refreshFilter();
}

// Sort packages by displayed module name
function sortPackages($html) {
  const packageList = $html.find("#module-list li.package, .package-list li.package");
  if (!packageList.length) return;

  packageList.each(function () {
    const cleanName = $(this)
      .find(".package-title")
      .first()
      .text()
      .toLowerCase()
      .replace(/[^ws]/g, "")
      .replace(/s/g, "");
    $(this).attr("data-sort-name", cleanName);
  });

  const parent = packageList.first().parent();
  packageList
    .sort((a, b) => {
      const aName = a.getAttribute("data-sort-name") || "";
      const bName = b.getAttribute("data-sort-name") || "";
      return aName < bName ? -1 : aName > bName ? 1 : 0;
    })
    .appendTo(parent);
}

// Hook on Settings Config Window
Hooks.on("renderSettingsConfig", (app, html) => {
  // Ensure html is a jQuery object
  const $html = $(html);

  // Wrap separate module settings
  $html
    .find(
      ":not(.sidebar) :not(.form-group) + .form-group, * :not(.sidebar) > .form-group:first-of-type"
    )
    .each(function () {
      $(this)
        .nextUntil(":not(.form-group)")
        .addBack()
        .wrapAll('<section class="module-settings-wrapper" />');
    });

  // Toggle checkboxes
  $html.find(".form-group label").each(function () {
    if ($(this).next("div").find('input[type="checkbox"]').length) {
      $(this).wrapInner("<span>");
    }
  });

  $html.find(".form-group label span").on("click", function () {
    const checkbox = $(this).parent().parent().find('input[type="checkbox"]');
    checkbox.click();
  });
});

// Hook on Module Management Window
Hooks.on("renderModuleManagement", (app, html) => {
  // Ensure html is a jQuery object
  const $html = $(html);

  let form = $html.find("form");
  if (!form.length || !$html.hasClass("form")) {
    form = $html;
  }

  // Inject controls once: the root element survives ApplicationV2 re-renders, the package list does not
  if (!form.find(".enhanced-module-management").length) injectControls();

  // Everything below works on the freshly rendered package list
  sortPackages($html);
  setupModuleCategories($html, form);

  // Hide disable all button if setting is enabled
  if (game.settings.get(MODULE_ID, "hideDisableAll")) {
    $html.find('button[name="deactivate"]').css("display", "none");
  }

  function injectControls() {

    // Button HTML templates
    const disable = `<button class="disable-all-modules">${game.i18n.localize(
      "TidyUI.uncheckAll"
    )}</button>`;

    const enable = `<button class="enable-all-modules">${game.i18n.localize(
      "TidyUI.checkAll"
    )}</button>`;

    const exportBtn = `<button class="modules-export" title="${game.i18n.localize(
      "TidyUI.export"
    )}"><i class="fas fa-file-export"></i></button>`;

    const importBtn = `<button class="modules-import" title="${game.i18n.localize(
      "TidyUI.import"
    )}"><i class="fas fa-file-import"></i></button>`;

    const exportOptions = `<section class="export-options" style="display: none;"><button class="modules-export-copy">${game.i18n.localize(
      "TidyUI.toClipboard"
    )}</button><button class="modules-download-json">${game.i18n.localize(
      "TidyUI.toFile"
    )}</button></section>`;

    const importOptions = `<section class="import-options" style="display: none;"><button class="modules-import-json">${game.i18n.localize(
      "TidyUI.fromFile"
    )}</button><button class="modules-import-confirm">${game.i18n.localize(
      "TidyUI.activate"
    )}</button></section>`;

    const modalExport = `<div id="importExportModal" style="display: none;"><div class="modal-wrap"><span id="close" title="${game.i18n.localize(
      "TidyUI.close"
    )}"><i class="fas fa-times"></i></span><div id="exportToast" style="display: none;"><p>${game.i18n.localize(
      "TidyUI.notice"
    )}</p></div><textarea spellcheck="false" id="modalIO" placeholder="${game.i18n.localize(
      "TidyUI.paste"
    )}"></textarea></div></div>`;

    const warningText = `<section class="warning"><span>${game.i18n.localize(
      "TidyUI.warning"
    )}</span> ${game.i18n.localize("TidyUI.instruction")}</section>`;

    // Add buttons and modal to form
    form.prepend(modalExport);
    form
      .find("#importExportModal .modal-wrap")
      .append(warningText, exportOptions, importOptions);
    form.prepend('<div class="enhanced-module-management"></div>');

    form
      .find(".enhanced-module-management")
      .append(disable, enable, exportBtn, importBtn);

    const disableAll = $html.find(".disable-all-modules");
    const enableAll = $html.find(".enable-all-modules");

    // Checkboxes of the packages currently shown (category filter and Foundry's own filters)
    function shownCheckboxes(selector = ".package") {
      return form
        .find(`${selector}:not(.tidy-filtered-out)`)
        .filter((i, el) => !isHiddenByFoundry(el))
        .find('input[type="checkbox"]');
    }

    // Remove all shown checkboxes except Tidy UI
    disableAll.on("click", function (e) {
      e.preventDefault();
      shownCheckboxes(
        '.package:not([data-module-id="tidy-ui_game-settings"]):not([data-module-id="tidy-ui"])'
      ).prop("checked", false);
    });

    // Set all shown checkboxes
    enableAll.on("click", function (e) {
      e.preventDefault();
      shownCheckboxes().prop("checked", true);
    });

    // Export/Import variables
    let modulesToImport = [];
    const json = {};
    let jsonProvided = false;

    const exportButton = form.find(".modules-export");
    const importButton = form.find(".modules-import");
    const exportCopyButton = form.find(".modules-export-copy");
    const downloadJsonButton = form.find(".modules-download-json");
    const importJsonButton = form.find(".modules-import-json");
    const importConfirmButton = form.find(".modules-import-confirm");

    // Open export window and generate list
    exportButton.on("click", function (e) {
      e.preventDefault();

      // Create JSON for modules
      const jsonActive = [];
      const jsonInactive = [];
      json.activeModules = jsonActive;
      json.inactiveModules = jsonInactive;

      let activeModules = "";
      let inactiveModules = "";
      const activeModuleList = form.find("#module-list input:checked, .package-list input:checked");
      const inactiveModuleList = form.find("#module-list input:not(:checked), .package-list input:not(:checked)");

      console.log("Active modules found:", activeModuleList.length);
      console.log("Inactive modules found:", inactiveModuleList.length);

      function extractModulesData(moduleList, jsonTarget) {
        let modulesString = "";
        for (let i = 0; i < moduleList.length; i++) {
          const checkbox = $(moduleList[i]);
          const packageEl = checkbox.closest(".package");
          const moduleTitle = packageEl.find(".package-title").text().trim();
          const moduleId = checkbox.attr("name");
          let version = packageEl.find(".tag.version").text().trim();

          if (!version) {
            version = packageEl.find(".version").text().trim();
          }

          // Remove "Version " prefix if present
          if (version.startsWith("Version ")) {
            version = version.substring(8);
          }

          if (i === moduleList.length - 1) {
            modulesString += moduleTitle + " v" + version + ";";
          } else {
            modulesString += moduleTitle + " v" + version + ";\n";
          }

          const moduleObj = {
            id: moduleId,
            title: moduleTitle,
            version: version
          };
          jsonTarget.push(moduleObj);
        }
        return modulesString;
      }

      activeModules = extractModulesData(activeModuleList, jsonActive);
      inactiveModules = extractModulesData(inactiveModuleList, jsonInactive);

      // Build and display copy text
      const modules = `Active Modules:\n----------\n${activeModules}\n\nInactive Modules:\n----------\n${inactiveModules}`;
      $html
        .find("#importExportModal")
        .removeClass()
        .addClass("export")
        .find("#modalIO")
        .val(modules);

      $html.find("#importExportModal").show();
      $html.find(".export-options").show();
      $html.find(".import-options").hide();
    });

    // Copy list to clipboard
    exportCopyButton.on("click", function (e) {
      e.preventDefault();
      const copyText = $html.find("#modalIO").val();

      // Modern Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(copyText).then(() => {
          $html.find("#importExportModal #exportToast").fadeIn();
        });
      } else {
        // Fallback
        $html.find("#modalIO").select();
        document.execCommand("copy");
        $html.find("#importExportModal #exportToast").fadeIn();
      }
      return false;
    });

    // Download JSON file
    downloadJsonButton.on("click", function (e) {
      e.preventDefault();
      const moduleListFile = JSON.stringify(json, null, 2);
      saveDataToFile(moduleListFile, "application/json", "moduleList.json");
    });

    // Close the import/export window
    $html.find("#importExportModal #close").on("click", function (e) {
      e.preventDefault();
      $html.find("#importExportModal").fadeOut(function () {
        $html.find("#modalIO").val("");
        $html.find("#importExportModal #exportToast").hide();
      });
    });

    // Open import input
    importButton.on("click", function (e) {
      e.preventDefault();
      modulesToImport = [];
      jsonProvided = false;
      $html.find("#importExportModal").removeClass().addClass("import").show();
      $html.find(".import-options").show();
      $html.find(".export-options").hide();
    });

    // Import JSON file
    importJsonButton.on("click", function (e) {
      e.preventDefault();
      const input = $('<input type="file" accept=".json">');
      input.on("change", importGameSettings);
      input.trigger("click");
    });

    function importGameSettings() {
      const file = this.files[0];
      if (!file) {
        console.log("No file provided for game settings importer.");
        return;
      }

      readTextFromFile(file).then((result) => {
        try {
          console.log("JSON provided");
          const modulesToActivate = JSON.parse(result);
          let modules = "Modules to activate\n----------\n\n";

          modulesToImport = [];
          for (let i = 0; i < modulesToActivate.activeModules.length; i++) {
            modulesToImport.push(modulesToActivate.activeModules[i].id);
            modules += modulesToActivate.activeModules[i].title + "\n";
          }

          $html
            .find("#importExportModal")
            .removeClass()
            .addClass("import")
            .find("#modalIO")
            .val(modules);
          jsonProvided = true;
        } catch (e) {
          console.error("Could not parse import data:", e);
          ui.notifications.error(game.i18n.localize("TidyUI.errorFileParse"));
        }
      });
    }

    // Activate all pasted modules and close window
    importConfirmButton.on("click", function (e) {
      e.preventDefault();

      if (!jsonProvided) {
        const importPaste = $html.find("#importExportModal #modalIO").val();

        if (!importPaste || importPaste.trim() === "") {
          ui.notifications.warn(game.i18n.localize("TidyUI.warnNoData"));
          return;
        }

        if (isJSON(importPaste)) {
          console.log("Valid JSON detected");
          try {
            const modulesToActivate = JSON.parse(importPaste);
            modulesToImport = [];

            if (modulesToActivate.activeModules && Array.isArray(modulesToActivate.activeModules)) {
              for (let i = 0; i < modulesToActivate.activeModules.length; i++) {
                modulesToImport.push(modulesToActivate.activeModules[i].id);
              }
            } else {
              ui.notifications.error(game.i18n.localize("TidyUI.errorMissingActive"));
              return;
            }
          } catch (e) {
            console.error("Error parsing JSON:", e);
            ui.notifications.error(game.i18n.localize("TidyUI.errorJsonParse"));
            return;
          }
        } else {
          ui.notifications.error(game.i18n.localize("TidyUI.errorPasteFormat"));
          return;
        }
      }

      // Uncheck all modules first
      $html.find(".package-list input, #module-list input").prop("checked", false);

      // Check imported modules, counting only those installed here
      let activated = 0;
      for (let i = 0; i < modulesToImport.length; i++) {
        const checkbox = $html.find(
          'input[name="' + $.escapeSelector(String(modulesToImport[i])) + '"]'
        );
        if (checkbox.length) activated++;
        checkbox.prop("checked", true);
      }

      ui.notifications.info(game.i18n.format("TidyUI.activated", { count: activated }));
      const missing = modulesToImport.length - activated;
      if (missing > 0) {
        ui.notifications.warn(game.i18n.format("TidyUI.missingModules", { count: missing }));
      }

      $html.find("#importExportModal").fadeOut(function () {
        $html.find("#modalIO").val("");
        modulesToImport = [];
        jsonProvided = false;
      });
    });

    // Check if valid JSON
    function isJSON(str) {
      if (/^\s*$/.test(str)) return false;
      try {
        JSON.parse(str);
        return true;
      } catch (e) {
        return false;
      }
    }
  }
});

// Register settings
Hooks.once("init", () => {
  game.settings.register("tidy-ui_game-settings", "hideDisableAll", {
    name: game.i18n.localize("TidyUI.hideDisableAll.name"),
    hint: game.i18n.localize("TidyUI.hideDisableAll.hint"),
    scope: "world",
    config: true,
    default: false,
    type: Boolean,
  });

  // Manual category assignments per module id, overriding auto-detection
  game.settings.register("tidy-ui_game-settings", "moduleCategories", {
    scope: "world",
    config: false,
    default: {},
    type: Object,
  });
});
