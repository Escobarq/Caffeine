# Caffeine Framework - Architecture

## Overview

Caffeine is a **hybrid framework** combining:
- **Backend**: Java 21 + JavaFX 21
- **Frontend**: HTML5 + CSS3 + JavaScript
- **Packaging**: Gradle + jpackage

## Architecture

```
┌─────────────────────────────────────────────┐
│  Your Application (HTML/CSS/JS + Java)      │
├─────────────────────────────────────────────┤
│  Caffeine Core: JavaFX WebView              │
│  ┌───────────────────────────────────────┐  │
│  │  Webkit Engine (renders HTML/CSS/JS)  │  │
│  └───────────────────────────────────────┘  │
├─────────────────────────────────────────────┤
│  Embedded Runtime: JVM + OS Bindings        │
├─────────────────────────────────────────────┤
│  Operating System (Windows/macOS/Linux)     │
└─────────────────────────────────────────────┘
```

## Components

### Backend (Java)

- **Launcher.java**: Entry point (required for JAR execution)
- **App.java**: Main JavaFX application
  - Detects execution mode (dev/prod)
  - Loads frontend (filesystem or JAR)
  - Creates WebView window

### Frontend (Web)

- Located in `frontend/` directory
- HTML/CSS/JavaScript - your app UI
- Loaded from filesystem (dev) or JAR (prod)

### CLI Tool

- **init**: Create new project
- **dev**: Start development server
- **build**: Compile to native executable

## Build Process

```
Development:
  frontend/ → caffeine dev → WebView → Display

Production:
  frontend/ → npm run build → JAR → jpackage → Executable
```

## Key Files

```
caffeine/
├── backend/                  # Java backend
│   ├── app/
│   │   ├── build.gradle     # Build config
│   │   └── src/
│   │       └── main/java/org/caffeine/app/
│   │           ├── App.java
│   │           └── Launcher.java
│   └── gradlew
├── packages/caffeine-cli/    # CLI tool
│   ├── index.js
│   ├── package.json
│   └── template/             # Project template
└── docs/
```

## Technologies

| Component | Version | Purpose |
|-----------|---------|---------|
| Java | 21+ | Backend language |
| JavaFX | 21 | GUI framework |
| Gradle | 9.2.0 | Build system |
| jpackage | JDK 14+ | Native packaging |
| Node.js | 16+ | CLI runtime |

## Modes

1. **Development**: `caffeine dev frontend`
   - Loads HTML from filesystem
   - Hot-reload on changes

2. **Production**: `npm run build`
   - Embeds frontend in JAR
   - Generates native executable

3. **Auto**: `./executable` (no args)
   - Automatically uses embedded frontend

---

For more details, see [README.md](./README.md) and [CONTRIBUTING.md](./CONTRIBUTING.md).
