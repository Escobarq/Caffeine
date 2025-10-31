#!/usr/bin/env node

const { spawn, execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");
const http = require("http");

let chokidar;
try {
  chokidar = require("chokidar");
} catch (e) {
  // chokidar is optional for hot-reload
}

const jarPath = path.join(__dirname, "bin", "Caffeine-1.0.0-all.jar");

// Hot-reload server
let hotReloadServer = null;
let hotReloadClients = [];

// --- Colors for Terminal ---
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  blue: "\x1b[36m",
  cyan: "\x1b[36m",
};

function log(msg, color = "reset") {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function logError(msg) {
  console.error(`${colors.red}❌ ${msg}${colors.reset}`);
}

function logSuccess(msg) {
  console.log(`${colors.green}✅ ${msg}${colors.reset}`);
}

function logInfo(msg) {
  console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`);
}

function logWarn(msg) {
  console.warn(`${colors.yellow}⚠️  ${msg}${colors.reset}`);
}

// --- Help Text ---
const helpText = `
${colors.bright}☕ Caffeine CLI - Build Desktop Apps with Java + Web${colors.reset}

${colors.bright}Usage:${colors.reset}
  caffeine <command> [options]

${colors.bright}Commands:${colors.reset}
  ${colors.cyan}init <name>${colors.reset}        Create a new Caffeine project
  ${colors.cyan}dev <path>${colors.reset}         Start development server
  ${colors.cyan}build${colors.reset}              Build for production
  ${colors.cyan}--help${colors.reset}             Show this help message
  ${colors.cyan}--version${colors.reset}          Show version

${colors.bright}Examples:${colors.reset}
  caffeine init my-app
  cd my-app
  caffeine dev frontend
  npm run build

${colors.bright}Documentation:${colors.reset}
  GitHub: https://github.com/Escobarq/Caffeine
  Docs: https://github.com/Escobarq/Caffeine#readme

`;

function showHelp() {
  console.log(helpText);
}

// --- Hot Reload Server ---
function startHotReloadServer(frontendPath, port = 9999) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      // Handle EventSource for live reload
      if (req.url === "/__hot-reload") {
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        });

        hotReloadClients.push(res);

        res.on("close", () => {
          hotReloadClients = hotReloadClients.filter(
            (client) => client !== res
          );
        });

        return;
      }

      // Serve static files
      let filePath = path.join(
        frontendPath,
        req.url === "/" ? "index.html" : req.url
      );

      // Prevent directory traversal
      if (!filePath.startsWith(frontendPath)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end("Not Found");
          return;
        }

        // Inject hot reload script in HTML files
        if (filePath.endsWith(".html")) {
          const hotReloadScript = `
<script>
(function() {
  const es = new EventSource("/__hot-reload");
  es.onmessage = () => {
    console.log("🔄 Reloading...");
    location.reload();
  };
  es.onerror = () => {
    es.close();
    setTimeout(() => window.location.reload(), 1000);
  };
})();
</script>`;
          data = data
            .toString()
            .replace("</body>", hotReloadScript + "</body>");
        }

        const mimeTypes = {
          ".html": "text/html",
          ".css": "text/css",
          ".js": "application/javascript",
          ".json": "application/json",
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".gif": "image/gif",
          ".svg": "image/svg+xml",
        };

        const ext = path.extname(filePath);
        const mimeType = mimeTypes[ext] || "text/plain";

        res.writeHead(200, { "Content-Type": mimeType });
        res.end(data);
      });
    });

    server.listen(port, () => {
      resolve(server);
    });
  });
}

// Broadcast reload to all connected clients
function broadcastReload() {
  hotReloadClients.forEach((client) => {
    client.write("data: reload\n\n");
  });
}

// --- Argument Parsing ---
const args = process.argv.slice(2);
const command = args[0];

// Check if JAR exists
function checkJar() {
  if (!fs.existsSync(jarPath)) {
    logError(`JAR not found: ${jarPath}`);
    logInfo("Trying to find Caffeine-1.0.0-all.jar...");

    const altPath = path.join(__dirname, "bin", "Caffeine-1.0.0-all.jar");
    if (!fs.existsSync(altPath)) {
      logError("Caffeine JAR not found in bin/ directory");
      logInfo("Please reinstall: npm install -g caffeine-cli");
      process.exit(1);
    }
    return altPath;
  }
  return jarPath;
}

function runJava(javaArgs) {
  const actualJarPath = checkJar();

  log(`🚀 Starting Caffeine application...`, "cyan");
  log(`   Java: java`, "dim");
  log(`   JAR: ${path.basename(actualJarPath)}`, "dim");
  log(`   Args: ${javaArgs.join(" ")}`, "dim");
  log("", "reset");

  const javaProcess = spawn("java", ["-jar", actualJarPath, ...javaArgs], {
    stdio: "inherit",
  });

  javaProcess.on("error", (err) => {
    logError(`Failed to start Java: ${err.message}`);
    logInfo("Make sure Java 21+ is installed: java -version");
    process.exit(1);
  });

  javaProcess.on("close", (code) => {
    if (code === 0) {
      logSuccess("Caffeine application closed successfully");
    } else {
      logError(`Caffeine exited with code ${code}`);
    }
    process.exit(code);
  });
}

// --- Command Logic ---

switch (command) {
  case "init":
    const projectName = args[1];
    if (!projectName) {
      logError("Project name is required");
      log("Usage: caffeine init <name>", "yellow");
      process.exit(1);
    }

    const projectPath = path.join(process.cwd(), projectName);
    const templatePath = path.join(__dirname, "template");

    log(`\n✨ Creating new Caffeine project: ${projectName}`, "cyan");

    if (fs.existsSync(projectPath)) {
      logError(`Directory '${projectName}' already exists`);
      process.exit(1);
    }

    if (!fs.existsSync(templatePath)) {
      logError(`Template not found at: ${templatePath}`);
      process.exit(1);
    }

    logInfo(`Copying template from: ${templatePath}`);
    fs.cpSync(templatePath, projectPath, { recursive: true });

    const appPackagePath = path.join(projectPath, "package.json");
    const appPackage = JSON.parse(fs.readFileSync(appPackagePath, "utf-8"));
    appPackage.name = projectName;
    fs.writeFileSync(appPackagePath, JSON.stringify(appPackage, null, 2));

    logSuccess("Project created successfully!");
    log(`\n📁 Next steps:`, "bright");
    log(`   cd ${projectName}`, "cyan");
    log(`   caffeine dev frontend`, "cyan");
    log(`\n📖 For more info: https://github.com/Escobarq/Caffeine\n`, "dim");

    break;

  case "dev":
    const frontendPath = args[1];
    if (!frontendPath) {
      logError("Frontend path is required");
      log("Usage: caffeine dev <path>", "yellow");
      process.exit(1);
    }

    const fullPath = path.resolve(frontendPath);
    if (!fs.existsSync(fullPath)) {
      logError(`Frontend path not found: ${fullPath}`);
      process.exit(1);
    }

    log(`\n🔧 Starting development mode with HOT RELOAD`, "cyan");
    logInfo(`Frontend path: ${fullPath}`);

    // Start hot-reload server
    const hotReloadPort = 8888;
    startHotReloadServer(fullPath, hotReloadPort).then((server) => {
      logSuccess(
        `✨ Hot-reload server started on http://localhost:${hotReloadPort}`
      );

      // Start Java process pointing to hot-reload server
      const actualJarPath = checkJar();
      log(`🚀 Starting Caffeine application...`, "cyan");
      log(`   Java: java`, "dim");
      log(`   JAR: ${path.basename(actualJarPath)}`, "dim");
      log(`   Frontend Server: http://localhost:${hotReloadPort}`, "dim");
      log("", "reset");

      const javaProcess = spawn(
        "java",
        ["-jar", actualJarPath, `http://localhost:${hotReloadPort}`],
        {
          stdio: "inherit",
        }
      );

      // Set up file watcher if chokidar is available
      if (chokidar) {
        const watcher = chokidar.watch(fullPath, {
          ignored: /(^|[\/\\])\.|node_modules/,
          persistent: true,
          awaitWriteFinish: {
            stabilityThreshold: 300,
            pollInterval: 100,
          },
        });

        watcher.on("all", (event, filePath) => {
          if (event === "add" || event === "change" || event === "unlink") {
            logInfo(`📝 File ${event}: ${path.basename(filePath)}`);
            // Broadcast reload to all clients
            broadcastReload();
          }
        });

        watcher.on("error", (error) => {
          logError(`Watcher error: ${error}`);
        });

        process.on("SIGINT", () => {
          logInfo("Stopping file watcher and server...");
          watcher.close();
          server.close();
          javaProcess.kill("SIGTERM");
          process.exit(0);
        });
      } else {
        process.on("SIGINT", () => {
          logInfo("Stopping server...");
          server.close();
          javaProcess.kill("SIGTERM");
          process.exit(0);
        });
      }

      javaProcess.on("error", (err) => {
        logError(`Failed to start Java: ${err.message}`);
        logInfo("Make sure Java 21+ is installed: java -version");
        server.close();
        process.exit(1);
      });

      javaProcess.on("close", (code) => {
        server.close();
        if (code === 0) {
          logSuccess("Caffeine application closed successfully");
        } else if (code !== null) {
          logError(`Caffeine exited with code ${code}`);
        }
        process.exit(code || 0);
      });
    });

    break;

  case "build":
    log(`\n📦 Building Caffeine application for production...`, "cyan");
    log("", "reset");

    let appName, appVersion;

    // Step 1: Prepare frontend
    try {
      log("  [1/3] 🏗️  Preparing frontend...", "bright");
      execSync("npm run prepare-build", { stdio: "inherit" });
      logSuccess("Frontend prepared");
    } catch (error) {
      logError("Failed to prepare frontend");
      logInfo("Make sure npm run prepare-build is defined in package.json");
      process.exit(1);
    }

    // Step 2: Embed in JAR
    log("\n  [2/3] 📦  Embedding frontend in JAR...", "bright");
    const buildDir = path.join(process.cwd(), "caffeine-build");
    const prodJarName = "Caffeine-App-Prod.jar";
    const prodJarPath = path.join(buildDir, prodJarName);

    try {
      if (fs.existsSync(buildDir)) {
        fs.rmSync(buildDir, { recursive: true, force: true });
      }
      fs.mkdirSync(buildDir);

      const actualJarPath = checkJar();
      fs.copyFileSync(actualJarPath, prodJarPath);

      const frontendDistPath = path.join(process.cwd(), "dist");
      const frontendStagingPath = path.join(buildDir, "frontend");

      if (!fs.existsSync(frontendDistPath)) {
        logWarn(
          "dist/ folder not found. Make sure npm run prepare-build created it"
        );
      } else {
        fs.mkdirSync(frontendStagingPath);
        fs.cpSync(frontendDistPath, frontendStagingPath, { recursive: true });
        execSync(`jar uf ${prodJarPath} -C ${buildDir} frontend`, {
          stdio: "inherit",
        });
      }

      logSuccess("JAR embedded successfully");
    } catch (error) {
      logError(`Failed to embed JAR: ${error.message}`);
      process.exit(1);
    }

    // Step 3: Create native executable
    log("\n  [3/3] 🚀  Creating native executable with jpackage...", "bright");
    const distNativeDir = path.join(process.cwd(), "dist-native");

    try {
      if (fs.existsSync(distNativeDir)) {
        fs.rmSync(distNativeDir, { recursive: true, force: true });
      }

      const userPackage = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), "package.json"), "utf-8")
      );

      appName = userPackage.name || "CaffeineApp";
      appVersion = userPackage.version || "1.0.0";

      logInfo(`App name: ${appName}`);
      logInfo(`App version: ${appVersion}`);

      const jpackageCmd = `jpackage --type app-image --name "${appName}" --input "${buildDir}" --main-jar "${prodJarName}" --main-class org.caffeine.app.Launcher --dest dist-native --app-version "${appVersion}"`;

      log("Running jpackage...", "dim");
      execSync(jpackageCmd, { stdio: "inherit" });

      logSuccess("Native executable created");
    } catch (error) {
      logError(`Failed to create native executable: ${error.message}`);
      logWarn("Make sure you have:");
      logWarn("  - Java 21+ installed");
      logWarn("  - jpackage available in PATH");
      logWarn("  - All dependencies in package.json");
      process.exit(1);
    }

    log("\n", "reset");
    logSuccess("Build completed successfully!");
    log(`\n🎁 Your application is ready in:`, "bright");
    log(`   dist-native/${appName}/bin/${appName}`, "cyan");
    log("\n📦 To run your app:", "bright");
    log(`   ./dist-native/${appName}/bin/${appName}`, "cyan");
    log("\n", "reset");

    break;

  case "--version":
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, "package.json"), "utf-8")
    );
    log(`caffeine-cli v${packageJson.version}`, "cyan");
    break;

  case "--help":
  case "-h":
  case "help":
  case undefined:
    showHelp();
    break;

  default:
    logError(`Unknown command: '${command}'`);
    log("Use 'caffeine --help' for available commands", "yellow");
    process.exit(1);
}
