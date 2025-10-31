# ☕ Caffeine Framework

> **Build desktop applications with Java 21 + JavaFX + HTML/CSS/JavaScript**

Caffeine is a modern framework for building **cross-platform desktop applications** using Java backend and web frontend. Similar to **Electron** and **Tauri**, but with the power and stability of **Java**.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Java 21](https://img.shields.io/badge/Java-21-orange)](https://www.oracle.com/java/)
[![JavaFX 21](https://img.shields.io/badge/JavaFX-21-blue)](https://gluonhq.com/products/javafx/)
[![Node.js 16+](https://img.shields.io/badge/Node.js-16%2B-green)](https://nodejs.org/)

## 🎯 Key Features

- ✅ **Hybrid Architecture**: Java backend + HTML/CSS/JavaScript frontend
- ✅ **Cross-Platform**: Windows, macOS, Linux with same codebase
- ✅ **Fast Development**: Hot-reload frontend without recompiling Java
- ✅ **Production Ready**: Native executables (~150MB)
- ✅ **No External Dependencies**: Embedded JVM in executable
- ✅ **Intuitive CLI**: Simple commands: `init`, `dev`, `build`

## 🚀 Quick Start

### Installation

```bash
npm install -g caffeine-cli
```

### Create Your First App

```bash
caffeine init my-app
cd my-app
caffeine dev frontend
npm run build
./dist-native/my-app/bin/my-app
```

## 📚 Documentation

- [README](./README.md) - Main documentation
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contributing guidelines
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - System architecture

## 📄 License

MIT - See [LICENSE](./LICENSE) for details

---

Built with ☕ Caffeine
