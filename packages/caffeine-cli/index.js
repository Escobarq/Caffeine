#!/usr/bin/env node

const { spawn, execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");
const http = require("http");

// UI Libraries
let chalk, Table, ora, boxen;
try {
  chalk = require("chalk");
  Table = require("cli-table3");
  ora = require("ora");
  boxen = require("boxen");
} catch (e) {
  // Fallback if UI libraries not available
  chalk = {
    green: (str) => str,
    red: (str) => str,
    yellow: (str) => str,
    blue: (str) => str,
    cyan: (str) => str,
    bold: (str) => str,
    dim: (str) => str,
  };
}

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

// --- System Diagnosis Functions ---
async function checkCommand(command, args = ["--version"]) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: "pipe" });
    let output = "";

    child.stdout.on("data", (data) => {
      output += data.toString();
    });

    child.stderr.on("data", (data) => {
      output += data.toString();
    });

    child.on("close", (code) => {
      resolve({
        available: code === 0,
        version: code === 0 ? output.trim().split("\n")[0] : null,
        error: code !== 0 ? output.trim() : null,
      });
    });

    child.on("error", () => {
      resolve({ available: false, version: null, error: "Command not found" });
    });
  });
}

async function checkJavaRequirements() {
  const javaResult = await checkCommand("java", ["-version"]);
  let javaOk = false;
  let javaVersion = "Not found";

  if (javaResult.available && javaResult.version) {
    // Parse Java version from output like 'java version "21.0.1"'
    const versionMatch = javaResult.version.match(/version "(\d+)\.?(\d*)/);
    if (versionMatch) {
      const majorVersion = parseInt(versionMatch[1]);
      javaOk = majorVersion >= 21;
      javaVersion = versionMatch[0].replace('version "', "").replace('"', "");
    }
  }

  return { available: javaResult.available, ok: javaOk, version: javaVersion };
}

async function checkNodeRequirements() {
  const nodeResult = await checkCommand("node", ["-v"]);
  let nodeOk = false;
  let nodeVersion = "Not found";

  if (nodeResult.available && nodeResult.version) {
    const versionMatch = nodeResult.version.match(/v(\d+)\.(\d+)/);
    if (versionMatch) {
      const majorVersion = parseInt(versionMatch[1]);
      nodeOk = majorVersion >= 16;
      nodeVersion = nodeResult.version;
    }
  }

  return { available: nodeResult.available, ok: nodeOk, version: nodeVersion };
}

async function checkPlatformSpecificDeps() {
  const platform = process.platform;
  const checks = {};

  if (platform === "win32") {
    // Check for common Windows issues
    checks.vcredist = {
      name: "Visual C++ Redist",
      status: "Unknown",
      note: "Check manually",
    };
    checks.graphics = {
      name: "Graphics Drivers",
      status: "Unknown",
      note: "Update recommended",
    };
  } else if (platform === "linux") {
    // Check for GTK libraries
    const gtkResult = await checkCommand("pkg-config", [
      "--exists",
      "gtk+-3.0",
    ]);
    checks.gtk = {
      name: "GTK+ 3.0",
      status: gtkResult.available ? "✅ Available" : "❌ Missing",
      note: gtkResult.available ? "" : "Install: sudo apt install libgtk-3-dev",
    };

    const x11Result = await checkCommand("xset", ["q"]);
    checks.display = {
      name: "X11 Display",
      status: x11Result.available ? "✅ Available" : "❌ Missing",
      note: x11Result.available ? "" : "Check DISPLAY variable",
    };
  } else if (platform === "darwin") {
    // Check for Xcode tools
    const xcodeResult = await checkCommand("xcode-select", ["-p"]);
    checks.xcode = {
      name: "Xcode Tools",
      status: xcodeResult.available ? "✅ Available" : "❌ Missing",
      note: xcodeResult.available ? "" : "Install: xcode-select --install",
    };
  }

  return checks;
}

function getOptimalJVMArgs() {
  const platform = process.platform;
  const baseArgs = [
    "--enable-native-access=ALL-UNNAMED",
    "--add-opens",
    "javafx.controls/javafx.scene.control=ALL-UNNAMED",
    "--add-opens",
    "javafx.graphics/javafx.scene=ALL-UNNAMED",
    "--add-opens",
    "javafx.base/javafx.util=ALL-UNNAMED",
  ];

  if (platform === "win32") {
    // Windows: Use software renderer as fallback
    return [
      ...baseArgs,
      "-Dprism.order=sw,d3d",
      "-Dprism.verbose=false",
      "-Djava.awt.headless=false",
    ];
  } else if (platform === "linux") {
    // Linux: Optimize for X11/Wayland
    return [...baseArgs, "-Dprism.order=gtk", "-Djava.awt.headless=false"];
  } else {
    // macOS: Use native renderer
    return [...baseArgs, "-Dprism.order=es2,sw", "-Djava.awt.headless=false"];
  }
}

async function runDoctorCommand() {
  // Show animated header
  if (boxen) {
    console.log(
      boxen(chalk.bold.cyan("🏥 Caffeine System Diagnosis"), {
        padding: 1,
        borderStyle: "round",
        borderColor: "cyan",
      })
    );
  } else {
    console.log(chalk.cyan.bold("\n🏥 Caffeine System Diagnosis"));
  }

  console.log(chalk.dim(`Platform: ${process.platform} ${os.arch()}\n`));

  // Animated spinner while checking
  const spinner = ora ? ora("Checking system requirements...").start() : null;

  // Check core requirements
  const javaCheck = await checkJavaRequirements();
  const nodeCheck = await checkNodeRequirements();
  const jarExists = fs.existsSync(jarPath);

  if (spinner) spinner.succeed("System requirements checked");

  // Create requirements table
  if (Table) {
    const requirementsTable = new Table({
      head: [
        chalk.bold("Requirement"),
        chalk.bold("Status"),
        chalk.bold("Version"),
      ],
      style: {
        head: ["cyan"],
        border: ["gray"],
      },
    });

    requirementsTable.push(
      [
        "Java 21+",
        javaCheck.ok ? chalk.green("✅ OK") : chalk.red("❌ Failed"),
        javaCheck.version,
      ],
      [
        "Node.js 16+",
        nodeCheck.ok ? chalk.green("✅ OK") : chalk.red("❌ Failed"),
        nodeCheck.version,
      ],
      [
        "Caffeine JAR",
        jarExists ? chalk.green("✅ Found") : chalk.red("❌ Missing"),
        jarExists ? "Available" : "Not found",
      ]
    );

    console.log("\n" + requirementsTable.toString());
  } else {
    // Fallback without table
    console.log("\nSystem Requirements:");
    console.log(
      `  Java 21+:     ${javaCheck.ok ? "✅" : "❌"} ${javaCheck.version}`
    );
    console.log(
      `  Node.js 16+:  ${nodeCheck.ok ? "✅" : "❌"} ${nodeCheck.version}`
    );
    console.log(
      `  Caffeine JAR: ${jarExists ? "✅" : "❌"} ${
        jarExists ? "Found" : "Missing"
      }`
    );
  }

  // Check platform-specific dependencies
  const platformSpinner = ora
    ? ora("Checking platform dependencies...").start()
    : null;
  const platformDeps = await checkPlatformSpecificDeps();

  if (platformSpinner) platformSpinner.succeed("Platform dependencies checked");

  if (Object.keys(platformDeps).length > 0 && Table) {
    const platformTable = new Table({
      head: [
        chalk.bold("Platform Dependency"),
        chalk.bold("Status"),
        chalk.bold("Notes"),
      ],
      style: {
        head: ["yellow"],
        border: ["gray"],
      },
    });

    for (const [key, dep] of Object.entries(platformDeps)) {
      const status = dep.status.includes("✅")
        ? chalk.green(dep.status)
        : dep.status.includes("❌")
        ? chalk.red(dep.status)
        : chalk.yellow(dep.status);

      platformTable.push([dep.name, status, dep.note || ""]);
    }

    console.log("\n" + platformTable.toString());
  }

  // Show optimal JVM configuration
  const jvmArgs = getOptimalJVMArgs();

  if (boxen) {
    const jvmConfig = jvmArgs.map((arg) => chalk.dim(`  ${arg}`)).join("\n");
    console.log(
      "\n" +
        boxen(
          chalk.bold(`Optimal JVM Configuration (${process.platform}):\n\n`) +
            jvmConfig,
          {
            padding: 1,
            borderStyle: "single",
            borderColor: "green",
            title: "⚙️  Configuration",
            titleAlignment: "center",
          }
        )
    );
  } else {
    console.log(
      chalk.green.bold(`\nOptimal JVM args for ${process.platform}:`)
    );
    jvmArgs.forEach((arg) => console.log(chalk.dim(`  ${arg}`)));
  }

  // Overall status
  const allGood = javaCheck.ok && nodeCheck.ok && jarExists;

  if (allGood) {
    if (boxen) {
      console.log(
        "\n" +
          boxen(
            chalk.green.bold("🎉 System ready for Caffeine development!\n") +
              chalk.cyan("You can start creating projects with: ") +
              chalk.yellow("caffeine init my-app"),
            {
              padding: 1,
              borderStyle: "double",
              borderColor: "green",
            }
          )
      );
    } else {
      console.log(
        chalk.green.bold("\n🎉 System ready for Caffeine development!")
      );
      console.log(
        chalk.cyan("You can start creating projects with: caffeine init my-app")
      );
    }
  } else {
    const issues = [];
    if (!javaCheck.ok) issues.push("• Install Java 21 or higher");
    if (!nodeCheck.ok) issues.push("• Install Node.js 16 or higher");
    if (!jarExists)
      issues.push("• Reinstall caffeine-cli: npm install -g caffeine-cli");

    if (boxen) {
      console.log(
        "\n" +
          boxen(
            chalk.yellow.bold("⚠️  Some requirements need attention:\n\n") +
              issues.map((issue) => chalk.red(issue)).join("\n"),
            {
              padding: 1,
              borderStyle: "single",
              borderColor: "yellow",
            }
          )
      );
    } else {
      console.log(chalk.yellow.bold("\n⚠️  Some requirements need attention:"));
      issues.forEach((issue) => console.log(chalk.red(`  ${issue}`)));
    }
  }

  console.log(
    chalk.dim(
      "\n📖 For more help: https://github.com/Escobarq/Caffeine#readme\n"
    )
  );
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
  ${colors.cyan}doctor${colors.reset}             Check system requirements
  ${colors.cyan}--help${colors.reset}             Show this help message
  ${colors.cyan}--version${colors.reset}          Show version

${colors.bright}Examples:${colors.reset}
  caffeine init my-app
  cd my-app
  caffeine dev frontend
  caffeine doctor
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

  // Get optimal JVM arguments based on platform
  const platformJvmArgs = getOptimalJVMArgs();
  const jvmArgs = [...platformJvmArgs, "-jar", actualJarPath];

  log(`🚀 Starting Caffeine application...`, "cyan");
  log(`   Java: java`, "dim");
  log(`   JAR: ${path.basename(actualJarPath)}`, "dim");
  log(`   Args: ${javaArgs.join(" ")}`, "dim");
  log("", "reset");

  const javaProcess = spawn("java", [...jvmArgs, ...javaArgs], {
    stdio: "inherit",
  });

  javaProcess.on("error", (err) => {
    logError(`Failed to start Java: ${err.message}`);
    logInfo("Make sure Java 21+ is installed: java -version");

    // Specific error handling for Windows JavaFX issues
    if (process.platform === "win32") {
      logWarn("Windows JavaFX troubleshooting:");
      logWarn("  1. Update graphics drivers");
      logWarn("  2. Install Visual C++ Redistributable");
      logWarn("  3. Try running as administrator");
      logWarn("  4. Check Windows Display Settings");
    }

    process.exit(1);
  });

  javaProcess.on("close", (code) => {
    if (code === 0) {
      logSuccess("Caffeine application closed successfully");
    } else if (code === 1) {
      logError(`Caffeine exited with code ${code}`);

      // Specific guidance for JavaFX runtime errors
      logInfo("JavaFX Runtime Error - Possible solutions:");
      logInfo("  1. Update Java to latest version (21+)");
      logInfo("  2. Update graphics drivers");

      if (process.platform === "win32") {
        logInfo("  3. Install Microsoft Visual C++ Redistributable");
        logInfo("  4. Run 'java -version' to verify Java installation");
        logInfo("  5. Try running command prompt as administrator");
      } else if (process.platform === "linux") {
        logInfo("  3. Install libgtk-3-dev libxss1 libgconf-2-4");
        logInfo("  4. Check DISPLAY variable: echo $DISPLAY");
      } else if (process.platform === "darwin") {
        logInfo("  3. Update macOS and Xcode Command Line Tools");
      }

      logInfo("  For more help: https://github.com/Escobarq/Caffeine/issues");
    } else {
      logError(`Caffeine exited with code ${code}`);
    }
    process.exit(code);
  });
}

// --- Command Logic ---

async function main() {
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

        // Get optimal JVM arguments based on platform
        const platformJvmArgs = getOptimalJVMArgs();
        const jvmArgs = [...platformJvmArgs, "-jar", actualJarPath];

        log(`🚀 Starting Caffeine application...`, "cyan");
        log(`   Java: java`, "dim");
        log(`   JAR: ${path.basename(actualJarPath)}`, "dim");
        log(`   Frontend Server: http://localhost:${hotReloadPort}`, "dim");
        log("", "reset");

        const javaProcess = spawn(
          "java",
          [...jvmArgs, `http://localhost:${hotReloadPort}`],
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

          // Specific error handling for Windows JavaFX issues
          if (process.platform === "win32") {
            logWarn("Windows JavaFX troubleshooting:");
            logWarn("  1. Update graphics drivers");
            logWarn("  2. Install Visual C++ Redistributable");
            logWarn("  3. Try running as administrator");
            logWarn("  4. Check Windows Display Settings");
          }

          server.close();
          process.exit(1);
        });

        javaProcess.on("close", (code) => {
          server.close();
          if (code === 0) {
            logSuccess("Caffeine application closed successfully");
          } else if (code === 1) {
            logError(`Caffeine exited with code ${code}`);

            // Specific guidance for JavaFX runtime errors
            logInfo("JavaFX Runtime Error - Possible solutions:");
            logInfo("  1. Update Java to latest version (21+)");
            logInfo("  2. Update graphics drivers");

            if (process.platform === "win32") {
              logInfo("  3. Install Microsoft Visual C++ Redistributable");
              logInfo("  4. Run 'java -version' to verify Java installation");
              logInfo("  5. Try running command prompt as administrator");
            } else if (process.platform === "linux") {
              logInfo("  3. Install libgtk-3-dev libxss1 libgconf-2-4");
              logInfo("  4. Check DISPLAY variable: echo $DISPLAY");
            } else if (process.platform === "darwin") {
              logInfo("  3. Update macOS and Xcode Command Line Tools");
            }

            logInfo(
              "  For more help: https://github.com/Escobarq/Caffeine/issues"
            );
          } else if (code !== null) {
            logError(`Caffeine exited with code ${code}`);
          }
          process.exit(code || 0);
        });
      });

      break;

    case "doctor":
      await runDoctorCommand();
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
      log(
        "\n  [3/3] 🚀  Creating native executable with jpackage...",
        "bright"
      );
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
}

// Run main function
main().catch((error) => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
});
