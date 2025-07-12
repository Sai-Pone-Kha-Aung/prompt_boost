#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

console.log("🔍 Validating Prompt Boost Extension...\n");

// Check required files
const requiredFiles = [
  "manifest.json",
  "src/html/popup.html",
  "src/js/popup.js",
  "src/js/content.js",
  "src/styles/content.css",
  "icons/icon16.png",
  "icons/icon48.png",
  "icons/icon128.png",
];

let allValid = true;

console.log("📁 Checking required files:");
requiredFiles.forEach((file) => {
  const filePath = path.join(__dirname, "..", file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`  ✅ ${file} (${stats.size} bytes)`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    allValid = false;
  }
});

// Validate manifest.json
console.log("\n📋 Validating manifest.json:");
try {
  const manifestPath = path.join(__dirname, "..", "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  // Check required fields
  const requiredFields = ["name", "version", "description", "manifest_version"];
  requiredFields.forEach((field) => {
    if (manifest[field]) {
      console.log(`  ✅ ${field}: ${manifest[field]}`);
    } else {
      console.log(`  ❌ ${field} - MISSING`);
      allValid = false;
    }
  });

  // Check permissions
  if (manifest.permissions && manifest.permissions.length > 0) {
    console.log(`  ✅ permissions: ${manifest.permissions.join(", ")}`);
  } else {
    console.log(`  ⚠️  permissions: none specified`);
  }

  // Check host permissions
  if (manifest.host_permissions && manifest.host_permissions.length > 0) {
    console.log(
      `  ✅ host_permissions: ${manifest.host_permissions.length} domains`
    );
  } else {
    console.log(`  ❌ host_permissions - MISSING`);
    allValid = false;
  }
} catch (error) {
  console.log(`  ❌ manifest.json - Invalid JSON: ${error.message}`);
  allValid = false;
}

// Check file sizes
console.log("\n📏 File size analysis:");
const maxSizes = {
  "popup.html": 100000, // 100KB
  "popup.js": 100000, // 100KB
  "content.js": 100000, // 100KB
  "content.css": 50000, // 50KB
};

Object.entries(maxSizes).forEach(([file, maxSize]) => {
  const filePath = path.join(__dirname, "..", file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    if (stats.size <= maxSize) {
      console.log(`  ✅ ${file}: ${stats.size} bytes (limit: ${maxSize})`);
    } else {
      console.log(
        `  ⚠️  ${file}: ${stats.size} bytes (exceeds limit: ${maxSize})`
      );
    }
  }
});

// Summary
console.log("\n" + "=".repeat(50));
if (allValid) {
  console.log("🎉 All validations passed! Extension is ready.");
  console.log("\n📦 Next steps:");
  console.log("  1. Load extension in Chrome Developer mode");
  console.log("  2. Test on supported AI platforms");
  console.log("  3. Run npm run package to create distribution zip");
  process.exit(0);
} else {
  console.log("❌ Validation failed. Please fix the issues above.");
  process.exit(1);
}
