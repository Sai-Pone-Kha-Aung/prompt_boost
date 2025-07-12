document.addEventListener("DOMContentLoaded", function () {
  const promptTitle = document.getElementById("promptTitle");
  const promptContent = document.getElementById("promptContent");
  const geminiApiKey = document.getElementById("geminiApiKey");
  const boostPromptBtn = document.getElementById("boostPrompt");
  const boostResult = document.getElementById("boostResult");
  const boostedTitle = document.getElementById("boostedTitle");
  const boostedContent = document.getElementById("boostedContent");
  const saveBoostPromptBtn = document.getElementById("saveBoostPrompt");
  const tryAgainBtn = document.getElementById("tryAgain");
  const promptsList = document.getElementById("promptsList");
  const emptyState = document.getElementById("emptyState");
  const promptCount = document.getElementById("promptCount");
  const messageDiv = document.getElementById("message");

  // Edit form elements
  const editForm = document.getElementById("editForm");
  const editTitle = document.getElementById("editTitle");
  const editContent = document.getElementById("editContent");
  const saveEditBtn = document.getElementById("saveEdit");
  const cancelEditBtn = document.getElementById("cancelEdit");

  let editingIndex = -1;
  let prompts = [];
  let currentBoostedPrompt = null;

  // Load saved prompts and API key on startup
  loadPrompts();
  loadApiKey();

  // Boost prompt functionality
  boostPromptBtn.addEventListener("click", function () {
    const title = promptTitle.value.trim();
    const content = promptContent.value.trim();
    const apiKey = geminiApiKey.value.trim();

    if (!title || !content) {
      showMessage("Please fill in both title and content fields.", "error");
      return;
    }

    if (!apiKey) {
      showMessage("Please enter your Gemini API key.", "error");
      return;
    }

    // Save API key for future use
    saveApiKey(apiKey);

    // Start boosting process
    boostPrompt(title, content, apiKey);
  });

  // Save boosted prompt
  saveBoostPromptBtn.addEventListener("click", function () {
    if (!currentBoostedPrompt) {
      showMessage("No boosted prompt to save.", "error");
      return;
    }

    // Check for duplicate titles
    if (
      prompts.some(
        (p) =>
          p.title.toLowerCase() === currentBoostedPrompt.title.toLowerCase()
      )
    ) {
      showMessage("A prompt with this title already exists.", "error");
      return;
    }

    const newPrompt = {
      id: Date.now().toString(),
      title: currentBoostedPrompt.title,
      content: currentBoostedPrompt.content,
      createdAt: new Date().toISOString(),
      improved: true,
      originalTitle: promptTitle.value.trim(),
      originalContent: promptContent.value.trim(),
    };

    prompts.push(newPrompt);
    savePromptsToStorage();

    // Clear form and hide boost result
    clearForm();
    hideBoostResult();

    renderPrompts();
    showMessage("Boosted prompt saved successfully! ✨", "success");
  });

  // Try again button
  tryAgainBtn.addEventListener("click", function () {
    hideBoostResult();
    showMessage("Ready to boost your prompt again!", "info");
  });

  async function boostPrompt(title, content, apiKey) {
    const originalText = boostPromptBtn.textContent;
    boostPromptBtn.textContent = "🔄 Boosting...";
    boostPromptBtn.disabled = true;

    try {
      showMessage("Boosting your prompt with AI...", "info");

      // Send to background script with API key
      const response = await chrome.runtime.sendMessage({
        action: "improvePrompt",
        promptText: content,
        title: title,
        apiKey: apiKey,
      });

      if (response && response.success) {
        // Store the boosted prompt
        currentBoostedPrompt = {
          title: response.improvedTitle,
          content: response.improvedText,
        };

        // Display the boosted result
        boostedTitle.textContent = response.improvedTitle;
        boostedContent.value = response.improvedText;
        boostResult.style.display = "block";

        showMessage("Prompt boosted successfully! ✨", "success");
      } else {
        throw new Error(response?.error || "Failed to boost prompt");
      }
    } catch (error) {
      console.error("Error boosting prompt:", error);
      showMessage(
        "Failed to boost prompt. Please check your API key and try again.",
        "error"
      );
    } finally {
      // Reset button state
      boostPromptBtn.textContent = originalText;
      boostPromptBtn.disabled = false;
    }
  }

  function hideBoostResult() {
    boostResult.style.display = "none";
    currentBoostedPrompt = null;
  }

  function clearForm() {
    promptTitle.value = "";
    promptContent.value = "";
  }

  function saveApiKey(apiKey) {
    chrome.storage.sync.set({ geminiApiKey: apiKey });
  }

  function loadApiKey() {
    chrome.storage.sync.get("geminiApiKey", function (result) {
      if (result.geminiApiKey) {
        geminiApiKey.value = result.geminiApiKey;
      }
    });
  }

  // Edit form functionality
  saveEditBtn.addEventListener("click", function () {
    const title = editTitle.value.trim();
    const content = editContent.value.trim();

    if (!title || !content) {
      showMessage("Please fill in both title and content fields.", "error");
      return;
    }

    // Check for duplicate titles (excluding current prompt)
    if (
      prompts.some(
        (p, index) =>
          index !== editingIndex &&
          p.title.toLowerCase() === title.toLowerCase()
      )
    ) {
      showMessage("A prompt with this title already exists.", "error");
      return;
    }

    prompts[editingIndex].title = title;
    prompts[editingIndex].content = content;
    prompts[editingIndex].updatedAt = new Date().toISOString();

    savePromptsToStorage();
    hideEditForm();
    showMessage("Prompt updated successfully!", "success");
    renderPrompts();
  });

  cancelEditBtn.addEventListener("click", hideEditForm);

  // Load prompts from storage
  function loadPrompts() {
    // Always load from local storage
    chrome.storage.local.get(["prompts"], function (localResult) {
      prompts = localResult.prompts || [];
      console.log(`Loaded ${prompts.length} prompts from local storage`);
      renderPrompts();
    });
  }

  // Save prompts to storage
  function savePromptsToStorage() {
    // Check storage size before saving
    const promptsData = JSON.stringify(prompts);
    const dataSize = new Blob([promptsData]).size;

    console.log("Saving prompts to local storage:", {
      promptsCount: prompts.length,
      dataSize: dataSize,
      storageType: "local",
    });

    // Always use local storage (no size limits)
    chrome.storage.local.set({ prompts: prompts }, function () {
      if (chrome.runtime.lastError) {
        const error = chrome.runtime.lastError;
        const errorMessage = error.message || "Unknown storage error";

        console.error("Local storage error:", {
          fullError: error,
          errorMessage: errorMessage,
          promptsCount: prompts.length,
          promptsSize: dataSize,
        });

        showMessage(`Storage Error: ${errorMessage}`, "error");
      } else {
        console.log("Prompts saved successfully to local storage");

        // Send sync message to notify content scripts
        chrome.runtime
          .sendMessage({
            action: "broadcastSync",
          })
          .catch((error) => {
            console.log("Could not send broadcast sync message:", error);
          });
      }
    });
  }

  // Render prompts list
  function renderPrompts() {
    promptCount.textContent = prompts.length;

    if (prompts.length === 0) {
      emptyState.style.display = "block";
      promptsList.innerHTML = "";
      promptsList.appendChild(emptyState);
      return;
    }

    emptyState.style.display = "none";

    const promptsHTML = prompts
      .map(
        (prompt, index) => `
            <div class="prompt-item ${
              prompt.improved ? "improved" : ""
            }" data-index="${index}">
                <div class="prompt-title">
                    ${prompt.improved ? "✨ " : ""}${escapeHtml(prompt.title)}
                </div>
                <div class="prompt-preview">${escapeHtml(prompt.content)}</div>
                <div class="prompt-actions">
                    <button class="btn-small btn-regenerate-small" data-action="regenerate" data-index="${index}">🎯 Improve</button>
                    <button class="btn-small btn-edit" data-action="edit" data-index="${index}">Edit</button>
                    <button class="btn-small btn-delete" data-action="delete" data-index="${index}">Delete</button>
                </div>
            </div>
        `
      )
      .join("");

    promptsList.innerHTML = promptsHTML;

    // Add event listeners to action buttons
    document.querySelectorAll(".prompt-actions button").forEach((button) => {
      button.addEventListener("click", handlePromptAction);
    });
  }

  // Handle prompt actions (edit/delete/regenerate)
  function handlePromptAction(event) {
    const action = event.target.dataset.action;
    const index = parseInt(event.target.dataset.index);

    if (action === "delete") {
      if (confirm("Are you sure you want to delete this prompt?")) {
        prompts.splice(index, 1);
        savePromptsToStorage();
        renderPrompts();
        showMessage("Prompt deleted successfully.", "success");
      }
    } else if (action === "edit") {
      showEditForm(index);
    } else if (action === "regenerate") {
      regeneratePrompt(index);
    }
  }

  // Show edit form
  function showEditForm(index) {
    editingIndex = index;
    const prompt = prompts[index];

    editTitle.value = prompt.title;
    editContent.value = prompt.content;

    editForm.classList.add("active");
    editTitle.focus();
  }

  // Hide edit form
  function hideEditForm() {
    editForm.classList.remove("active");
    editingIndex = -1;
    editTitle.value = "";
    editContent.value = "";
  }

  // Regenerate prompt using AI
  async function regeneratePrompt(index) {
    const prompt = prompts[index];
    const apiKey = geminiApiKey.value.trim();
    const button = document.querySelector(
      `[data-action="regenerate"][data-index="${index}"]`
    );

    if (!button) return;

    // Check if API key is provided
    if (!apiKey) {
      showMessage("Please enter your Gemini API key first.", "error");
      return;
    }

    // Show loading state
    const originalText = button.textContent;
    button.textContent = "🔄 Improving...";
    button.disabled = true;

    try {
      showMessage("Improving your prompt...", "info");

      // Send to background script with API key
      const improvedPrompt = await chrome.runtime.sendMessage({
        action: "improvePrompt",
        promptText: prompt.content,
        title: prompt.title,
        apiKey: apiKey,
      });

      if (improvedPrompt && improvedPrompt.success) {
        // Update the prompt with the improved version
        prompts[index].content = improvedPrompt.improvedText;
        prompts[index].title = improvedPrompt.improvedTitle || prompt.title;
        prompts[index].updatedAt = new Date().toISOString();
        prompts[index].improved = true;

        savePromptsToStorage();
        renderPrompts();
        showMessage("Prompt improved successfully! ✨", "success");
      } else {
        throw new Error(improvedPrompt?.error || "Failed to improve prompt");
      }
    } catch (error) {
      console.error("Error improving prompt:", error);
      showMessage(
        "Failed to improve prompt. Please check your API key and try again.",
        "error"
      );
    } finally {
      // Reset button state
      button.textContent = originalText;
      button.disabled = false;
    }
  }

  // Show message
  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = "block";

    setTimeout(() => {
      messageDiv.style.display = "none";
    }, 3000);
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Handle Enter key in form fields
  promptTitle.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      promptContent.focus();
    }
  });

  promptContent.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      boostPromptBtn.click();
    }
  });

  editTitle.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      editContent.focus();
    }
  });

  editContent.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      saveEditBtn.click();
    }
  });

  // Auto-resize textareas
  [promptContent, editContent].forEach((textarea) => {
    textarea.addEventListener("input", function () {
      this.style.height = "auto";
      this.style.height = Math.min(this.scrollHeight, 150) + "px";
    });
  });

  // Export functionality (for future use)
  window.exportPrompts = function () {
    const dataStr = JSON.stringify(prompts, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "prompt-boost-backup.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import functionality (for future use)
  window.importPrompts = function (fileInput) {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const importedPrompts = JSON.parse(e.target.result);
        if (Array.isArray(importedPrompts)) {
          prompts = [...prompts, ...importedPrompts];
          savePromptsToStorage();
          renderPrompts();
          showMessage(
            `Imported ${importedPrompts.length} prompts successfully!`,
            "success"
          );
        }
      } catch (error) {
        showMessage("Invalid backup file format.", "error");
      }
    };
    reader.readAsText(file);
  };
});
