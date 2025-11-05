// ============================================================================
// Tidy UI Game Settings - Enhanced Module Management (Foundry VTT v13 compatible)
// ============================================================================

// Track expanded module sections
let expandedModules = [];

// ============================================================================
// SETTINGS CONFIG WINDOW HANDLER
// ============================================================================
Hooks.on("renderSettingsConfig", (app, html) => {
  const $html = html instanceof jQuery ? html : $(html);

  // Wrap module settings into sections
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

  // Make labels clickable for checkboxes
  $html.find(".form-group label").each(function () {
    if ($(this).next("div").find('input[type="checkbox"]').length) {
      $(this).wrapInner("<span>");
    }
  });

  $html.find(".form-group label span").on("click", function () {
    const checkbox = $(this).closest(".form-group").find('input[type="checkbox"]');
    checkbox.trigger("click");
  });
});

// ============================================================================
// MODULE MANAGEMENT WINDOW HANDLER
// ============================================================================
Hooks.on("renderModuleManagement", (app, html) => {
  const $html = html instanceof jQuery ? html : $(html);
  let form = $html.find("form");
  if (!form.length) form = $html;

  // --------------------------------------------------------------------------
  // UI Button Definitions
  // --------------------------------------------------------------------------
  const t = (key) => game.i18n.localize(key);
  const buttons = {
    disable: `<button class="disable-all-modules">${t("TidyUI.uncheckAll")}</button>`,
    enable: `<button class="enable-all-modules">${t("TidyUI.checkAll")}</button>`,
    export: `<button class="modules-export" title="${t("TidyUI.export")}"><i class="fas fa-file-export"></i></button>`,
    import: `<button class="modules-import" title="${t("TidyUI.import")}"><i class="fas fa-file-import"></i></button>`
  };

  const exportOptions = `
    <section class="export-options">
      <button class="modules-export-copy">${t("TidyUI.toClipboard")}</button>
      <button class="modules-download-json">${t("TidyUI.toFile")}</button>
    </section>`;

  const importOptions = `
    <section class="import-options">
      <button class="modules-import-json">${t("TidyUI.fromFile")}</button>
      <button class="modules-import-confirm">${t("TidyUI.activate")}</button>
    </section>`;

  const modalExport = `
    <div id="importExportModal">
      <div class="modal-wrap">
        <span id="close" title="${t("TidyUI.close")}"><i class="fas fa-times"></i></span>
        <div id="exportToast"><p>${t("TidyUI.notice")}</p></div>
        <textarea spellcheck="false" id="modalIO" placeholder="${t("TidyUI.paste")}"></textarea>
      </div>
    </div>`;

  const warningText = `
    <section class="warning"><span>${t("TidyUI.warning")}</span> ${t("TidyUI.instruction")}</section>`;

  // --------------------------------------------------------------------------
  // Inject UI
  // --------------------------------------------------------------------------
  form.prepend(modalExport);
  form.find("#importExportModal .modal-wrap").append(warningText, exportOptions, importOptions);
  form.prepend('<div class="enhanced-module-management"></div>');
  form.find(".enhanced-module-management").append(buttons.disable, buttons.enable, buttons.export, buttons.import);

  const disableAll = $html.find(".disable-all-modules");
  const enableAll = $html.find(".enable-all-modules");

  // --------------------------------------------------------------------------
  // Sorting modules alphabetically
  // --------------------------------------------------------------------------
  const title = $html.find(".package-title");
  title.each(function () {
    const clean = $(this)
      .text()
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s/g, "");
    $(this).closest(".package").attr("data-sort-name", clean);
  });

  const sorted = $html.find("li.package").sort((a, b) =>
    $(a).attr("data-sort-name").localeCompare($(b).attr("data-sort-name"))
  );
  $html.find("ul, #module-list").append(sorted);

  // --------------------------------------------------------------------------
  // Enable / Disable All Buttons
  // --------------------------------------------------------------------------
  disableAll.on("click", (e) => {
    e.preventDefault();
    $html
      .find(
        'li.package:not([data-module-id="tidy-ui_game-settings"]):not([data-module-id="tidy-ui"]) input[type="checkbox"]'
      )
      .prop("checked", false);
  });

  enableAll.on("click", (e) => {
    e.preventDefault();
    $html.find('li.package input[type="checkbox"]').prop("checked", true);
  });

  // --------------------------------------------------------------------------
  // Export / Import Logic
  // --------------------------------------------------------------------------
  let jsonProvided = false;
  let modulesToImport = [];

  const exportButton = form.find(".modules-export");
  const importButton = form.find(".modules-import");
  const exportCopyButton = form.find(".modules-export-copy");
  const downloadJsonButton = form.find(".modules-download-json");
  const importJsonButton = form.find(".modules-import-json");
  const importConfirmButton = form.find(".modules-import-confirm");

  // Open export modal
  exportButton.on("click", (e) => {
    e.preventDefault();

    const json = {
      activeModules: [],
      inactiveModules: []
    };

    const activeInputs = $html.find('li.package input[type="checkbox"]:checked');
    const inactiveInputs = $html.find('li.package input[type="checkbox"]:not(:checked)');

    activeInputs.each(function () {
      const id = this.name;
      const title = $(this).closest(".package").find(".package-title").text().trim();
      const version = $(this).closest(".package").find(".version").text().replace(/^v/i, "");
      json.activeModules.push({ id, title, version });
    });

    inactiveInputs.each(function () {
      const id = this.name;
      const title = $(this).closest(".package").find(".package-title").text().trim();
      const version = $(this).closest(".package").find(".version").text().replace(/^v/i, "");
      json.inactiveModules.push({ id, title, version });
    });

    const exportText = `Active Modules:\n----------\n${json.activeModules
      .map((m) => `${m.title} v${m.version}`)
      .join("\n")}\n\nInactive Modules:\n----------\n${json.inactiveModules
      .map((m) => `${m.title} v${m.version}`)
      .join("\n")}`;

    $html.find("#importExportModal").removeClass().addClass("export").find("#modalIO").val(exportText);
    $html.find("#importExportModal").fadeIn();

    // Save JSON reference for download
    form.data("exportJson", json);
  });

  // Copy to clipboard
  exportCopyButton.on("click", async (e) => {
    e.preventDefault();
    const textArea = $html.find("#modalIO")[0];
    textArea.select();
    try {
      await navigator.clipboard.writeText(textArea.value);
    } catch {
      document.execCommand("copy");
    }
    $html.find("#importExportModal #exportToast").fadeIn();
  });

  // Download as JSON
  downloadJsonButton.on("click", (e) => {
    e.preventDefault();
    const json = form.data("exportJson") || {};
    const data = JSON.stringify(json, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "moduleList.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  // Close modal
  $html.find("#importExportModal #close").on("click", (e) => {
    e.preventDefault();
    $html.find("#importExportModal").fadeOut(() => {
      $html.find("#modalIO").val("");
      $html.find("#importExportModal #exportToast").hide();
    });
  });

  // Open import modal
  importButton.on("click", (e) => {
    e.preventDefault();
    jsonProvided = false;
    modulesToImport = [];
    $html.find("#importExportModal").removeClass().addClass("import").fadeIn();
  });

  // Import JSON file
  importJsonButton.on("click", (e) => {
    e.preventDefault();
    const input = $('<input type="file" accept=".json">');
    input.on("change", function () {
      const file = this.files[0];
      if (!file) return;
      file.text().then((result) => {
        try {
          const parsed = JSON.parse(result);
          modulesToImport = parsed.activeModules.map((m) => m.id);
          const list = parsed.activeModules.map((m) => m.title).join("\n");
          $html.find("#modalIO").val(list);
          jsonProvided = true;
        } catch (err) {
          console.error("Invalid JSON:", err);
        }
      });
    });
    input.trigger("click");
  });

  // Confirm Import
  importConfirmButton.on("click", (e) => {
    e.preventDefault();
    if (!jsonProvided) {
      const inputText = $html.find("#modalIO").val();
      try {
        const parsed = JSON.parse(inputText);
        modulesToImport = parsed.activeModules.map((m) => m.id);
      } catch {
        modulesToImport = inputText
          .split(";")
          .map((s) => s.trim())
          .filter((s) => s.length);
      }
    }

    $html.find('li.package input[type="checkbox"]').prop("checked", false);
    for (const id of modulesToImport) {
      $html.find(`li.package input[name="${id}"]`).prop("checked", true);
    }

    $html.find("#importExportModal").fadeOut(() => {
      $html.find("#modalIO").val("");
    });
  });

  // Hide disable all button if configured
  if (game.settings.get("tidy-ui_game-settings", "hideDisableAll")) {
    $html.find('button[name="deactivate"]').hide();
  }
});

// ============================================================================
// REGISTER SETTINGS
// ============================================================================
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
