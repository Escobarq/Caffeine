# ☕ Caffeine CLI

> Build desktop applications with Java 21 + JavaFX + HTML/CSS/JavaScript

Caffeine is a **command-line tool** for creating and building cross-platform desktop applications using Java backend and web frontend.

## 🚀 Installation

```bash
npm install -g caffeine-cli
```

## 📝 Quick Start

### Create a new project

```bash
caffeine init my-app
cd my-app
```

### Development mode

```bash
# Start with hot-reload
caffeine dev frontend

# Edit frontend/index.html, style.css, main.js
# Changes appear instantly in the window
```

### Build for production

```bash
# Compile and create native executable
npm run build

# Run the app
./dist-native/my-app/bin/my-app
```

## 🎯 Commands

### `caffeine init <name>`

Creates a new Caffeine project in a directory with the given name.

```bash
caffeine init my-app
cd my-app
```

**Creates:**

- Frontend boilerplate (HTML/CSS/JS)
- Backend structure (Java)
- Build scripts
- Configuration files

### `caffeine dev <path>`

Starts the application in development mode with hot-reload.

```bash
caffeine dev frontend
```

**Benefits:**

- Frontend loaded from local files
- Changes reflected without recompile
- Perfect for debugging

### `npm run build`

Compiles the application for production.

```bash
npm run build
```

**3-step process:**

1. Prepare frontend (`npm run prepare-build`)
2. Embed in JAR (`Caffeine-App-Prod.jar`)
3. Generate native executable (`jpackage`)

**Result:** Native app in `dist-native/`

## 📁 Project Structure

```
my-app/
├── frontend/                 # HTML/CSS/JavaScript
│   ├── index.html
│   ├── style.css
│   └── main.js
├── src-caffeine/             # Java backend (optional)
│   └── app/
├── package.json              # Build scripts
└── dist-native/              # Final application
    └── my-app/bin/my-app     # Executable
```

## 🛠️ Requirements

- **Node.js** 16+ (for CLI)
- **Java JDK 21+** (auto-downloaded by Gradle)
- **jpackage** (included in JDK 14+)

### Install Java

**Linux (Debian/Ubuntu):**

```bash
sudo apt install default-jdk
```

**Linux (Arch):**

```bash
sudo pacman -S jdk-openjdk
```

**macOS:**

```bash
brew install openjdk@21
```

**Windows:**
Download from [Oracle](https://www.oracle.com/java/technologies/downloads/) or [Adoptium](https://adoptium.net/)

## 📚 Documentation

- [Main Repository](https://github.com/Escobarq/Caffeine)
- [Architecture](https://github.com/Escobarq/Caffeine/blob/main/docs/ARCHITECTURE.md)
- [Contributing](https://github.com/Escobarq/Caffeine/blob/main/CONTRIBUTING.md)

## 🐛 Troubleshooting

### "jpackage not found"

Ensure your JDK has jpackage:

```bash
jpackage --version
```

If it fails, install JDK 14+:

- [Adoptium](https://adoptium.net/)
- [Oracle](https://www.oracle.com/java/technologies/downloads/)

### "Cannot find caffeine command"

Install globally:

```bash
npm install -g caffeine-cli
```

Or link locally:

```bash
npm link
```

### Application won't start

1. Check Java: `java -version`
2. Check Node.js: `node --version`
3. Review error messages carefully

## 📄 License

MIT - See LICENSE in [main repository](https://github.com/Escobarq/Caffeine)

## 🔗 Links

- [GitHub Repository](https://github.com/Escobarq/Caffeine)
- [NPM Package](https://npmjs.com/package/caffeine-cli)
- [Report Issues](https://github.com/Escobarq/Caffeine/issues)

---

**Built with ☕ Caffeine**

_Power of Java. Simplicity of Web._
