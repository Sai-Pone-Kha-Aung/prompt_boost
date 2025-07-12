// Single Responsibility Principle: Find and manipulate input fields
class InputFieldFinder extends window.ContentInterfaces.IInputFieldFinder {
  constructor(platformDetector) {
    super();
    this.platformDetector = platformDetector;
    this.inputSelectors = platformDetector.getInputSelectors();
  }

  findInputField() {
    console.log("🔍 Looking for input field...");

    // Try each selector until we find a visible input field
    for (const selector of this.inputSelectors) {
      const elements = document.querySelectorAll(selector);

      for (const element of elements) {
        if (
          this.isElementVisible(element) &&
          !element.disabled &&
          !element.readOnly
        ) {
          console.log("✅ Found input field with selector:", selector, element);
          return element;
        }
      }
    }

    // Fallback: look for any focused input
    const activeElement = document.activeElement;
    if (activeElement && this.isValidInputElement(activeElement)) {
      console.log("✅ Found active input field:", activeElement);
      return activeElement;
    }

    // Additional fallback: look for the largest visible textarea
    const largestTextarea = this.findLargestTextarea();
    if (largestTextarea) {
      console.log("✅ Found largest textarea as fallback:", largestTextarea);
      return largestTextarea;
    }

    console.log("❌ No input field found");
    return null;
  }

  isValidInputElement(element) {
    return (
      element.tagName === "TEXTAREA" ||
      element.tagName === "INPUT" ||
      element.contentEditable === "true"
    );
  }

  findLargestTextarea() {
    const allTextareas = Array.from(
      document.querySelectorAll("textarea")
    ).filter((el) => this.isElementVisible(el) && !el.disabled && !el.readOnly);

    if (allTextareas.length === 0) return null;

    // Sort by area (width * height) and take the largest
    return allTextareas.sort((a, b) => {
      const aRect = a.getBoundingClientRect();
      const bRect = b.getBoundingClientRect();
      return bRect.width * bRect.height - aRect.width * aRect.height;
    })[0];
  }

  isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);

    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0"
    );
  }

  setInputValue(element, value) {
    if (element.contentEditable === "true") {
      // For contenteditable elements (like Gemini)
      element.textContent = value;
      // Trigger input events
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    } else {
      // For textarea and input elements
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        element.constructor.prototype,
        "value"
      ).set;

      nativeInputValueSetter.call(element, value);

      // Trigger events that modern frameworks expect
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
      element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true }));
      element.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
    }
  }
}

// Export for use in other modules
window.ContentUtils = window.ContentUtils || {};
window.ContentUtils.InputFieldFinder = InputFieldFinder;
