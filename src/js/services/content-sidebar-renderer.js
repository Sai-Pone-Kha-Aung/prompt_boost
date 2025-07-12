// Single Responsibility Principle: Handle sidebar UI rendering
class SidebarRenderer extends window.ContentInterfaces.ISidebarRenderer {
  constructor() {
    super();
    this.sidebar = null;
    this.isVisible = true;
  }

  createSidebar() {
    // Remove existing sidebar if it exists
    const existingSidebar = document.getElementById("prompt-boost-sidebar");
    if (existingSidebar) {
      existingSidebar.remove();
    }

    // Create sidebar container
    this.sidebar = document.createElement("div");
    this.sidebar.id = "prompt-boost-sidebar";
    this.sidebar.innerHTML = `
      <div class="pb-sidebar-header">
        <div class="pb-sidebar-content-header">
          <h3 class="pb-sidebar-title">
            ⚡ Prompts
            <span class="pb-prompt-count">0</span>
          </h3>
        </div>
        <button class="pb-toggle-btn" title="Toggle Sidebar">
          <span style="text-align: center; padding-bottom: 2px; background: transparent; border: none; cursor: pointer;">
            →
          </span>
        </button>
      </div>
      <div class="pb-sidebar-content">
        <ul class="pb-prompts-list"></ul>
      </div>
    `;

    // Add toggle functionality
    const toggleBtn = this.sidebar.querySelector(".pb-toggle-btn");
    toggleBtn.addEventListener("click", () => this.toggleSidebar());

    // Add to page
    document.body.appendChild(this.sidebar);
  }

  updateSidebar(prompts) {
    if (!this.sidebar) {
      console.log("⚠️ Sidebar not found, cannot update");
      return;
    }

    console.log(`🔄 Updating sidebar with ${prompts.length} prompts`);

    const promptsList = this.sidebar.querySelector(".pb-prompts-list");
    const promptCount = this.sidebar.querySelector(".pb-prompt-count");

    promptCount.textContent = prompts.length;

    if (prompts.length === 0) {
      promptsList.innerHTML = `
        <div class="pb-empty-state">
          <div class="pb-empty-icon">📝</div>
          <p class="pb-empty-text">No prompts saved yet.<br>Use the extension popup to add prompts!</p>
        </div>
      `;
      return;
    }

    const promptsHTML = prompts
      .map(
        (prompt, index) => `
          <li class="pb-prompt-item" data-index="${index}">
            <div class="pb-prompt-title">${this.escapeHtml(prompt.title)}</div>
            <div class="pb-prompt-preview">${this.escapeHtml(
              prompt.content
            )}</div>
            <div class="pb-status-indicator"></div>
          </li>
        `
      )
      .join("");

    promptsList.innerHTML = promptsHTML;
  }

  toggleSidebar() {
    this.isVisible = !this.isVisible;
    const toggleIcon = this.sidebar.querySelector(".pb-toggle-btn span");
    const toggleBtn = this.sidebar.querySelector(".pb-toggle-btn");
    const sidebarContentHeader = this.sidebar.querySelector(
      ".pb-sidebar-content-header"
    );

    if (this.isVisible) {
      this.sidebar.classList.remove("collapsed");
      sidebarContentHeader.style.display = "flex";
      toggleIcon.textContent = "→";
    } else {
      this.sidebar.classList.add("collapsed");
      sidebarContentHeader.style.display = "none";
      toggleBtn.style.justifyContent = "flex-start";
      toggleIcon.textContent = "←";
    }
  }

  showNotification(message, type = "info") {
    // Create notification element
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed !important;
      top: 20px !important;
      right: 300px !important;
      background: ${type === "error" ? "#ff4757" : "#2ed573"} !important;
      color: white !important;
      padding: 12px 20px !important;
      border-radius: 6px !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      font-size: 14px !important;
      font-weight: 500 !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
      z-index: 2147483648 !important;
      opacity: 0 !important;
      transform: translateY(-10px) !important;
      transition: all 0.3s ease !important;
      max-width: 300px !important;
      word-wrap: break-word !important;
    `;

    notification.textContent = message;
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.opacity = "1";
      notification.style.transform = "translateY(0)";
    }, 10);

    // Animate out and remove
    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.transform = "translateY(-10px)";

      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  addClickListeners(prompts, onPromptClick) {
    if (!this.sidebar) return;

    this.sidebar.querySelectorAll(".pb-prompt-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        const index = parseInt(e.currentTarget.dataset.index);
        onPromptClick(prompts[index], e.currentTarget);
      });
    });
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// Export for use in other modules
window.ContentServices = window.ContentServices || {};
window.ContentServices.SidebarRenderer = SidebarRenderer;
