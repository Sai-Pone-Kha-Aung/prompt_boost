// Export/Import functionality
class ImportExportUtility {
  constructor(promptManager, uiRenderer) {
    this.promptManager = promptManager;
    this.uiRenderer = uiRenderer;
  }

  exportPrompts() {
    const prompts = this.promptManager.getPrompts();
    const dataStr = JSON.stringify(prompts, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "prompt-boost-backup.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  importPrompts(fileInput) {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedPrompts = JSON.parse(e.target.result);
        if (Array.isArray(importedPrompts)) {
          const currentPrompts = this.promptManager.getPrompts();
          this.promptManager.prompts = [...currentPrompts, ...importedPrompts];
          this.promptManager.storageService.savePrompts(
            this.promptManager.prompts
          );
          this.uiRenderer.renderPrompts(this.promptManager.prompts);
          this.uiRenderer.showMessage(
            `Imported ${importedPrompts.length} prompts successfully!`,
            "success"
          );
        }
      } catch (error) {
        this.uiRenderer.showMessage("Invalid backup file format.", "error");
      }
    };
    reader.readAsText(file);
  }
}

// Export for use in other modules
window.PopupUtils = window.PopupUtils || {};
window.PopupUtils.ImportExportUtility = ImportExportUtility;
