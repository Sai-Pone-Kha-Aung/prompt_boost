// Single Responsibility: Handle UI rendering and DOM manipulation
class UIRenderer extends window.PopupInterfaces.IUIRenderer {
  constructor(elements) {
    super();
    this.elements = elements;
  }

  renderPrompts(prompts) {
    this.elements.promptCount.textContent = prompts.length;

    if (prompts.length === 0) {
      this.elements.emptyState.style.display = "block";
      this.elements.promptsList.innerHTML = "";
      this.elements.promptsList.appendChild(this.elements.emptyState);
      return;
    }

    this.elements.emptyState.style.display = "none";

    const promptsHTML = prompts
      .map(
        (prompt, index) => `
            <div class="prompt-item ${
              prompt.improved ? "improved" : ""
            }" data-index="${index}">
                <div class="prompt-title">
                    ${prompt.improved ? "✨ " : ""}${this.escapeHtml(
          prompt.title
        )}
                </div>
                <div class="prompt-preview">${this.escapeHtml(
                  prompt.content
                )}</div>
                <div class="prompt-actions">
                    <button class="btn-small btn-regenerate-small" data-action="regenerate" data-index="${index}">🎯 Improve</button>
                    <button class="btn-small btn-edit" data-action="edit" data-index="${index}">Edit</button>
                    <button class="btn-small btn-delete" data-action="delete" data-index="${index}">Delete</button>
                </div>
            </div>
        `
      )
      .join("");

    this.elements.promptsList.innerHTML = promptsHTML;
  }

  showMessage(text, type) {
    this.elements.messageDiv.textContent = text;
    this.elements.messageDiv.className = `message ${type}`;
    this.elements.messageDiv.style.display = "block";

    setTimeout(() => {
      this.elements.messageDiv.style.display = "none";
    }, 3000);
  }

  clearForm() {
    this.elements.promptTitle.value = "";
    this.elements.promptContent.value = "";
  }

  showEditForm(index) {
    this.elements.editForm.classList.add("active");
    this.elements.editTitle.focus();
  }

  hideEditForm() {
    this.elements.editForm.classList.remove("active");
    this.elements.editTitle.value = "";
    this.elements.editContent.value = "";
  }

  showBoostResult(boostedPrompt) {
    this.elements.boostedTitle.textContent = boostedPrompt.title;
    this.elements.boostedContent.value = boostedPrompt.content;
    this.elements.boostResult.style.display = "block";
  }

  hideBoostResult() {
    this.elements.boostResult.style.display = "none";
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// Export for use in other modules
window.PopupServices = window.PopupServices || {};
window.PopupServices.UIRenderer = UIRenderer;
