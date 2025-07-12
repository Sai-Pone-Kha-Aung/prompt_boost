// Background script for Prompt Boost extension
// Handles API calls to Gemini AI for prompt improvement

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "improvePrompt") {
    handleImprovePrompt(request, sendResponse);
    return true; // Keep the message channel open for async response
  } else if (request.action === "broadcastSync") {
    handleBroadcastSync(sendResponse);
    return true; // Keep the message channel open for async response
  }
});

async function handleBroadcastSync(sendResponse) {
  try {
    // Get all tabs with our content script URLs
    const tabs = await chrome.tabs.query({
      url: [
        "https://chatgpt.com/*",
        "https://chat.deepseek.com/*",
        "https://grok.com/*",
        "https://gemini.google.com/*",
      ],
    });

    // Send sync message to each tab
    const promises = tabs.map((tab) => {
      return chrome.tabs
        .sendMessage(tab.id, { action: "syncPrompts" })
        .catch((error) => {
          console.log(`Could not send sync message to tab ${tab.id}:`, error);
        });
    });

    await Promise.all(promises);
    sendResponse({ success: true });
  } catch (error) {
    console.error("Error broadcasting sync:", error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleImprovePrompt(request, sendResponse) {
  const { promptText, title, apiKey } = request;

  try {
    // Validate inputs
    if (!promptText || !title || !apiKey) {
      sendResponse({
        success: false,
        error: "Missing required parameters: promptText, title, or apiKey",
      });
      return;
    }

    // Call Gemini API to improve the prompt
    const improvedPrompt = await improvePromptWithGemini(
      promptText,
      title,
      apiKey
    );

    sendResponse({
      success: true,
      improvedText: improvedPrompt.content,
      improvedTitle: improvedPrompt.title,
    });
  } catch (error) {
    console.error("Error improving prompt:", error);
    sendResponse({
      success: false,
      error: error.message || "Failed to improve prompt",
    });
  }
}

async function improvePromptWithGemini(promptText, title, apiKey) {
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  // Create a detailed prompt for improvement
  const systemPrompt = `You are an expert prompt engineer. Your task is to improve the given prompt to make it more effective, clear, and comprehensive. 

Please improve the following prompt by:
1. Making it more specific and detailed
2. Adding context and structure
3. Including clear instructions or objectives
4. Making it more engaging and effective
5. Ensuring it follows best practices for AI interactions

Original Title: "${title}"
Original Prompt: "${promptText}"

Please respond with a JSON object containing:
- "title": An improved, concise title for the prompt
- "content": The improved prompt text

Make sure the improved prompt is significantly better than the original while maintaining its core intent.`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: systemPrompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    },
  };

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Gemini API error (${response.status}): ${
          errorData.error?.message || response.statusText
        }`
      );
    }

    const data = await response.json();

    if (
      !data.candidates ||
      !data.candidates[0] ||
      !data.candidates[0].content
    ) {
      throw new Error("Invalid response from Gemini API");
    }

    const generatedText = data.candidates[0].content.parts[0].text;

    // Try to parse JSON response
    let improvedPrompt;
    try {
      // Look for JSON object in the response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        improvedPrompt = JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON found, create a simple improvement
        improvedPrompt = {
          title: `Enhanced: ${title}`,
          content: generatedText.trim(),
        };
      }
    } catch (parseError) {
      // Fallback if JSON parsing fails
      improvedPrompt = {
        title: `Enhanced: ${title}`,
        content: generatedText.trim(),
      };
    }

    // Validate the response structure
    if (!improvedPrompt.title || !improvedPrompt.content) {
      throw new Error("Generated prompt is missing title or content");
    }

    return improvedPrompt;
  } catch (error) {
    console.error("Gemini API call failed:", error);

    // Provide more specific error messages
    if (error.message.includes("401") || error.message.includes("403")) {
      throw new Error(
        "Invalid API key. Please check your Gemini API key and try again."
      );
    } else if (error.message.includes("429")) {
      throw new Error(
        "API rate limit exceeded. Please wait a moment and try again."
      );
    } else if (error.message.includes("400")) {
      throw new Error(
        "Invalid request. Please check your prompt and try again."
      );
    } else {
      throw new Error(`API request failed: ${error.message}`);
    }
  }
}

// Handle extension installation/update
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("Prompt Boost extension installed successfully!");
  } else if (details.reason === "update") {
    console.log("Prompt Boost extension updated successfully!");
  }
});
