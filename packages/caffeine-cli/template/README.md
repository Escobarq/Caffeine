# Caffeine App

Nueva aplicación creada con [Caffeine Framework](https://github.com/Escobarq/Caffeine).

## 🚀 Quick Start

### Desarrollo

```bash
# Inicia el servidor de desarrollo
caffeine dev frontend

# En otra terminal, edita los archivos en frontend/
```

### Compilar para Producción

```bash
# Build completo con jpackage
npm run build

# La app compilada estará en:
# dist-native/[nombre-app]/bin/[nombre-app]
```

## 📁 Estructura

```
.
├── frontend/              # Tu código HTML/CSS/JS
│   ├── index.html
│   ├── style.css
│   └── main.js
├── src-caffeine/          # Backend Java (opcional)
│   └── app/
│       ├── build.gradle
│       └── src/
├── package.json           # Scripts y dependencias
├── dist/                  # Generado: frontend compilado
└── dist-native/           # Generado: app ejecutable
```

## 📝 Desarrollo

1. **Edita** `frontend/index.html`, `style.css`, `main.js`
2. **Guarda** - Los cambios se reflejan automáticamente
3. **Prueba** en la ventana JavaFX

## 📦 Compilar

```bash
npm run build
```

Genera una aplicación nativa completamente independiente en `dist-native/`.

## 🔗 Recursos

- [GitHub Caffeine](https://github.com/Escobarq/Caffeine)
- [Documentación](https://github.com/Escobarq/Caffeine#readme)

---

¡Construido con ☕ Caffeine!
