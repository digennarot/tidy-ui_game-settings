// Set up array for toggle modules
const expandedModules = [];

// Hook on Settings Config Window
Hooks.on("renderSettingsConfig", (app, html) => {
  // Ensure html is a jQuery object
  html = $(html);
  
  // Wrap separate module settings
  html
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
  html.find(".form-group label").each(function () {
    if ($(this).next("div").find('input[type="checkbox"]').length) {
      $(this).wrapInner("<span>");
    }
  });

  html.find(".form-group label span").on("click", function () {
    const checkbox = $(this).parent().parent().find('input[type="checkbox"]');
    checkbox.click();
  });
});

// Hook on Module Management Window
Hooks.on("renderModuleManagement", (app, html) => {
  // Ensure html is a jQuery object
  html = $(html);
  
  let form = html.find("form");
  if (!form.length || !html.hasClass("form")) {
    form = html;
  }

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

  const disableAll = html.find(".disable-all-modules");
  const enableAll = html.find(".enable-all-modules");

  // Sorting - clean module names
  const title = html.find(".package-title");
  title.each(function () {
    const titleString = $(this).text();
    const cleanString = titleString
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s/g, "");
    $(this).closest(".package").attr("data-sort-name", cleanString);
  });

  // Sort by displayed module name
  function ascendingSort(a, b) {
    return $(b).attr("data-sort-name").toUpperCase() <
      $(a).attr("data-sort-name").toUpperCase()
      ? 1
      : -1;
  }

  const packageList = html.find("#module-list li.package, .package-list li.package");
  if (packageList.length > 0) {
    const parent = packageList.first().parent();
    packageList.sort(ascendingSort).appendTo(parent);
  }

  // Remove all checkboxes except Tidy UI
  disableAll.on("click", function (e) {
    e.preventDefault();
    const checkbox = form.find(
      '.package:not([data-module-id="tidy-ui_game-settings"]):not([data-module-id="tidy-ui"]) input[type="checkbox"]'
    );
    checkbox.prop("checked", false);
  });

  // Set all checkboxes
  enableAll.on("click", function (e) {
    e.preventDefault();
    const checkbox = form.find('.package input[type="checkbox"]');
    checkbox.prop("checked", true);
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

    // Get active modules
    for (let i = 0; i < activeModuleList.length; i++) {
      const checkbox = $(activeModuleList[i]);
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
      
      if (i === activeModuleList.length - 1) {
        activeModules += moduleTitle + " v" + version + ";";
      } else {
        activeModules += moduleTitle + " v" + version + ";\n";
      }
      
      const moduleObj = {
        id: moduleId,
        title: moduleTitle,
        version: version
      };
      jsonActive.push(moduleObj);
    }

    // Get inactive modules
    for (let i = 0; i < inactiveModuleList.length; i++) {
      const checkbox = $(inactiveModuleList[i]);
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
      
      if (i === inactiveModuleList.length - 1) {
        inactiveModules += moduleTitle + " v" + version + ";";
      } else {
        inactiveModules += moduleTitle + " v" + version + ";\n";
      }
      
      const moduleObj = {
        id: moduleId,
        title: moduleTitle,
        version: version
      };
      jsonInactive.push(moduleObj);
    }

    // Build and display copy text
    const modules = `Active Modules:\n----------\n${activeModules}\n\nInactive Modules:\n----------\n${inactiveModules}`;
    html
      .find("#importExportModal")
      .removeClass()
      .addClass("export")
      .find("#modalIO")
      .val(modules);

    html.find("#importExportModal").show();
    html.find(".export-options").show();
    html.find(".import-options").hide();
  });

  // Copy list to clipboard
  exportCopyButton.on("click", function (e) {
    e.preventDefault();
    html.find("#modalIO").select();
    document.execCommand("copy");
    html.find("#importExportModal #exportToast").fadeIn();
    return false;
  });

  // Download JSON file
  downloadJsonButton.on("click", function (e) {
    e.preventDefault();
    const moduleListFile = JSON.stringify(json, null, 2);
    saveDataToFile(moduleListFile, "application/json", "moduleList.json");
  });

  // Close the import/export window
  $("#importExportModal #close").on("click", function (e) {
    e.preventDefault();
    html.find("#importExportModal").fadeOut(function () {
      html.find("#modalIO").val("");
      html.find("#importExportModal #exportToast").hide();
    });
  });

  // Open import input
  importButton.on("click", function (e) {
    e.preventDefault();
    modulesToImport = [];
    jsonProvided = false;
    html.find("#importExportModal").removeClass().addClass("import").show();
    html.find(".import-options").show();
    html.find(".export-options").hide();
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

    readTextFromFile(file).then(async (result) => {
      try {
        console.log("JSON provided");
        const modulesToActivate = JSON.parse(result);
        let modules = "Modules to activate\n----------\n\n";

        modulesToImport = [];
        for (let i = 0; i < modulesToActivate.activeModules.length; i++) {
          modulesToImport.push(modulesToActivate.activeModules[i].id);
          modules += modulesToActivate.activeModules[i].title + "\n";
        }
        
        html
          .find("#importExportModal")
          .removeClass()
          .addClass("import")
          .find("#modalIO")
          .val(modules);
        jsonProvided = true;
      } catch (e) {
        console.error("Could not parse import data:", e);
        ui.notifications.error("Failed to parse JSON file. Please check the file format.");
      }
    });
  }

  // Activate all pasted modules and close window
  importConfirmButton.on("click", function (e) {
    e.preventDefault();
    
    if (!jsonProvided) {
      const importPaste = html.find("#importExportModal #modalIO").val();
      
      if (!importPaste || importPaste.trim() === "") {
        ui.notifications.warn("Please provide module data to import.");
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
          }
        } catch (e) {
          console.error("Error parsing JSON:", e);
          ui.notifications.error("Failed to parse JSON data.");
          return;
        }
      } else {
        console.log("Using old format");
        modulesToImport = importPaste
          .replace(/\s/g, "")
          .replace(/--v.*?;/g, ";")
          .slice(0, -1)
          .split(";")
          .filter(m => m.length > 0);
      }
    }

    // Uncheck all modules first
    html.find(".package-list input, #module-list input").prop("checked", false);
    
    // Check imported modules
    for (let i = 0; i < modulesToImport.length; i++) {
      html
        .find('input[name="' + modulesToImport[i] + '"]')
        .prop("checked", true);
    }

    $("#importExportModal").fadeOut(function () {
      html.find("#modalIO").val("");
      modulesToImport = [];
      jsonProvided = false;
    });
    
    ui.notifications.info(`Activated ${modulesToImport.length} modules. Don't forget to save!`);
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

  // Hide disable all button if setting is enabled
  if (game.settings.get("tidy-ui_game-settings", "hideDisableAll")) {
    html.find('button[name="deactivate"]').css("display", "none");
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
});
