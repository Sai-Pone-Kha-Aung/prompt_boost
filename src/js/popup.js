// Main popup script - loads all modules and initializes the application

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", async function () {
  // Create the main application instance
  const app = new window.PopupApp.PopupApplication();

  // Create import/export utility
  const importExportUtility = new window.PopupUtils.ImportExportUtility(
    app.promptManager,
    app.uiRenderer
  );

  // Export/Import functionality for global access
  window.exportPrompts = function () {
    importExportUtility.exportPrompts();
  };

  window.importPrompts = function (fileInput) {
    importExportUtility.importPrompts(fileInput);
  };

  // Store app instance globally for export/import functions
  window.promptBoostApp = app;

  // Initialize the application
  await app.initialize();
});
