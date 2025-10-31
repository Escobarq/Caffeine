# ☕ Caffeine App

Nueva aplicación de escritorio creada con [Caffeine Framework](https://github.com/Escobarq/Caffeine).

Combina la potencia de **Java 21 + JavaFX** con el desarrollo moderno de **HTML/CSS/JavaScript**.

## 🚀 Inicio Rápido

### 1️⃣ Desarrollo

```bash
# Inicia el servidor de desarrollo con hot-reload
npm run dev

# O explícitamente:
caffeine dev frontend
```

Los cambios en archivos se detectan automáticamente y se muestran en la ventana de la app.

### 2️⃣ Compilar para Producción

```bash
# Build completo
npm run build

# La app ejecutable está en:
# dist-native/[nombre-app]/bin/[nombre-app]
```

### 3️⃣ Ejecutar la App Compilada

```bash
./dist-native/[nombre-app]/bin/[nombre-app]
```

## 📁 Estructura del Proyecto

```
.
├── frontend/                    # Tu código HTML/CSS/JS
│   ├── index.html              # Interfaz principal
│   ├── style.css               # Estilos
│   └── main.js                 # Lógica del frontend
│
├── src-caffeine/               # Backend Java (opcional)
│   ├── settings.gradle         # Configuración del proyecto
│   └── app/
│       ├── build.gradle        # Build config
│       └── src/
│           ├── main/
│           │   └── java/org/caffeine/app/
│           │       ├── Launcher.java    # Punto de entrada
│           │       └── App.java         # Aplicación JavaFX
│           └── test/           # Tests
│
├── package.json                # Scripts y dependencias
├── README.md                   # Este archivo
├── dist/                       # Generado: frontend compilado
└── dist-native/                # Generado: aplicación ejecutable
```

## 🎨 Desarrollo

### Editar Frontend

1. Abre cualquier editor (VS Code, etc)
2. Edita archivos en `frontend/`:
   - `index.html` - Estructura
   - `style.css` - Estilos
   - `main.js` - Lógica
3. Guarda el archivo
4. El cambio se detecta automáticamente ✨
5. Actualiza la ventana de la app (Ctrl+R o cierra/abre)

### Personalizar Backend

Si necesitas lógica Java personalizada:

1. Edita archivos en `src-caffeine/app/src/main/java/`
2. Compila: `cd src-caffeine && ./gradlew build`
3. Reinicia el servidor de desarrollo

## 📦 Build y Distribución

```bash
npm run build
```

Genera una aplicación nativa completamente independiente en `dist-native/`.

## 🔗 Recursos

- [GitHub Caffeine](https://github.com/Escobarq/Caffeine)
- [Documentación](https://github.com/Escobarq/Caffeine#readme)

---

¡Construido con ☕ Caffeine!
