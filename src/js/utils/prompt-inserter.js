// Single Responsibility Principle: Handle prompt insertion logic
class PromptInserter {
  constructor(inputFieldFinder, sidebarRenderer) {
    this.inputFieldFinder = inputFieldFinder;
    this.sidebarRenderer = sidebarRenderer;
  }

  insertPrompt(prompt, itemElement) {
    const inputField = this.inputFieldFinder.findInputField();

    if (!inputField) {
      this.sidebarRenderer.showNotification(
        "No input field found. Please click in the chat input first.",
        "error"
      );
      return;
    }

    // Add visual feedback
    itemElement.classList.add("inserting");

    try {
      // Insert the prompt content
      this.inputFieldFinder.setInputValue(inputField, prompt.content);

      // Show success feedback
      this.sidebarRenderer.showNotification(
        `Inserted: ${prompt.title}`,
        "success"
      );

      // Focus the input field
      inputField.focus();

      // Position cursor at the end
      if (inputField.setSelectionRange) {
        const length = inputField.value.length;
        inputField.setSelectionRange(length, length);
      }
    } catch (error) {
      console.error("Error inserting prompt:", error);
      this.sidebarRenderer.showNotification(
        "Failed to insert prompt. Please try again.",
        "error"
      );
    } finally {
      // Remove visual feedback
      setTimeout(() => {
        itemElement.classList.remove("inserting");
      }, 1000);
    }
  }
}

// Export for use in other modules
window.ContentUtils = window.ContentUtils || {};
window.ContentUtils.PromptInserter = PromptInserter;
