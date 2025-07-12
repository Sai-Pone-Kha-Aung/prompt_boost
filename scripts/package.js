#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("📦 Packaging Prompt Boost Extension...\n");

// Read version from manifest
const manifestPath = path.join(__dirname, "..", "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const version = manifest.version;

console.log(`📋 Extension: ${manifest.name} v${version}`);

// Create dist directory
const distDir = path.join(__dirname, "..", "dist");
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

// Files to include in package
const filesToPackage = [
  "manifest.json",
  "popup.html",
  "popup.js",
  "content.js",
  "content.css",
  "background.js",
  "icons/",
  "README.md",
  "LICENSE",
];

// Create zip filename
const zipName = `prompt-boost-v${version}.zip`;
const zipPath = path.join(distDir, zipName);

console.log("\n📁 Files to package:");
filesToPackage.forEach((file) => {
  const filePath = path.join(__dirname, "..", file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      console.log(`  📂 ${file}`);
    } else {
      console.log(`  📄 ${file} (${stats.size} bytes)`);
    }
  } else {
    console.log(`  ❌ ${file} - MISSING`);
  }
});

try {
  // Remove existing zip if it exists
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  // Create zip using system zip command
  const filesToZip = filesToPackage.join(" ");
  const command = `cd "${path.join(
    __dirname,
    ".."
  )}" && zip -r "${zipPath}" ${filesToZip} -x "*.DS_Store" "node_modules/*" ".git/*" "dist/*" "scripts/*" "test.html" "*.log"`;

  console.log("\n🗜️  Creating zip archive...");
  execSync(command, { stdio: "pipe" });

  // Check zip was created
  if (fs.existsSync(zipPath)) {
    const stats = fs.statSync(zipPath);
    console.log(`✅ Package created: ${zipName} (${stats.size} bytes)`);

    console.log("\n📦 Package contents:");
    try {
      const listCommand = `unzip -l "${zipPath}"`;
      const output = execSync(listCommand, { encoding: "utf8" });
      console.log(output);
    } catch (e) {
      console.log("  (Unable to list contents - zip created successfully)");
    }

    console.log("\n🎉 Packaging complete!");
    console.log("\n📋 Next steps:");
    console.log("  1. Test the extension locally first");
    console.log(`  2. Upload ${zipName} to Chrome Web Store`);
    console.log("  3. Fill out store listing details");
    console.log("  4. Submit for review");
  } else {
    throw new Error("Zip file was not created");
  }
} catch (error) {
  console.error("❌ Packaging failed:", error.message);

  // Fallback: manual file copy method
  console.log("\n🔄 Attempting fallback method...");
  try {
    const packageDir = path.join(distDir, `prompt-boost-v${version}`);

    // Create package directory
    if (fs.existsSync(packageDir)) {
      fs.rmSync(packageDir, { recursive: true, force: true });
    }
    fs.mkdirSync(packageDir, { recursive: true });

    // Copy files
    filesToPackage.forEach((file) => {
      const srcPath = path.join(__dirname, "..", file);
      const destPath = path.join(packageDir, file);

      if (fs.existsSync(srcPath)) {
        const stats = fs.statSync(srcPath);
        if (stats.isDirectory()) {
          fs.mkdirSync(destPath, { recursive: true });
          // Copy directory contents
          const files = fs.readdirSync(srcPath);
          files.forEach((subFile) => {
            if (!subFile.startsWith(".")) {
              fs.copyFileSync(
                path.join(srcPath, subFile),
                path.join(destPath, subFile)
              );
            }
          });
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    });

    console.log(`✅ Files copied to: ${packageDir}`);
    console.log("📝 Manually zip this folder for Chrome Web Store submission");
  } catch (fallbackError) {
    console.error("❌ Fallback method also failed:", fallbackError.message);
    process.exit(1);
  }
}
