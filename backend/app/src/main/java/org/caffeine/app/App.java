package org.caffeine.app;

import java.awt.BorderLayout;
import java.io.File;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import javax.swing.JFrame;
import org.cef.CefApp;
import org.cef.CefClient;
import org.cef.browser.CefBrowser;
import me.friwi.jcefmaven.CefAppBuilder;
import me.friwi.jcefmaven.MavenCefAppHandlerAdapter;
import me.friwi.jcefmaven.impl.progress.ConsoleProgressHandler;

public class App {

    public static void main(String[] args) {
        CefAppBuilder builder = new CefAppBuilder();

        // Configurar el directorio donde se instalarán los binarios de Chromium
        builder.setInstallDir(new File("jcef-bundle"));
        builder.setProgressHandler(new ConsoleProgressHandler());

        // Argumentos para optimizar JCEF
        builder.addJcefArgs("--disable-gpu");

        // Configuración de CEF
        builder.getCefSettings().windowless_rendering_enabled = false;

        // Configurar el manejador de la aplicación
        builder.setAppHandler(new MavenCefAppHandlerAdapter() {
            // Aquí se pueden personalizar handlers si es necesario
        });

        CefApp app = null;
        try {
            app = builder.build();

            // Crear la ventana principal
            JFrame frame = new JFrame("Caffeine Application");
            frame.setDefaultCloseOperation(JFrame.DO_NOTHING_ON_CLOSE);
            frame.setSize(1024, 768);

            // Crear el cliente y navegador CEF
            CefClient client = app.createClient();

            // Determinar la URL del index.html
            String indexUrl = getIndexUrl();

            CefBrowser browser = client.createBrowser(indexUrl, false, false);
            frame.getContentPane().add(browser.getUIComponent(), BorderLayout.CENTER);

            // Variable final para usar en el listener
            final CefApp finalApp = app;
            frame.addWindowListener(new java.awt.event.WindowAdapter() {
                @Override
                public void windowClosing(java.awt.event.WindowEvent windowEvent) {
                    finalApp.dispose();
                    frame.dispose();
                    System.exit(0);
                }
            });

            frame.setVisible(true);

        } catch (Exception e) {
            e.printStackTrace();
            System.exit(1);
        }
    }

    /**
     * Obtiene la URL del index.html, ya sea desde el sistema de archivos
     * (modo desarrollo) o desde dentro del JAR (modo producción)
     */
    private static String getIndexUrl() {
        try {
            // Primero intentar cargar desde el sistema de archivos (modo desarrollo)
            File devIndexFile = new File("../frontend/index.html");
            if (devIndexFile.exists()) {
                System.out.println("🔧 Modo desarrollo: Cargando desde " + devIndexFile.getAbsolutePath());
                return devIndexFile.toURI().toString();
            }

            // Si no existe, extraer desde el JAR (modo producción)
            System.out.println("📦 Modo producción: Extrayendo frontend desde JAR...");

            // Crear directorio temporal para el frontend
            Path tempDir = Files.createTempDirectory("caffeine-frontend");
            tempDir.toFile().deleteOnExit();

            // Lista de archivos del frontend a extraer
            String[] frontendFiles = {
                    "index.html",
                    "style.css",
                    "main.js"
            };

            // Extraer todos los archivos del frontend
            for (String fileName : frontendFiles) {
                Path destFile = tempDir.resolve(fileName);
                extractResource("/frontend/" + fileName, destFile);
                destFile.toFile().deleteOnExit();
                System.out.println("  ✓ Extraído: " + fileName);
            }

            File indexFile = tempDir.resolve("index.html").toFile();
            System.out.println("✅ Frontend extraído a: " + tempDir.toAbsolutePath());

            return indexFile.toURI().toString();

        } catch (Exception e) {
            System.err.println("❌ Error al cargar index.html: " + e.getMessage());
            e.printStackTrace();
            // URL de fallback
            return "about:blank";
        }
    }

    /**
     * Extrae un recurso desde el JAR al sistema de archivos
     */
    private static void extractResource(String resourcePath, Path destination) throws Exception {
        try (InputStream in = App.class.getResourceAsStream(resourcePath)) {
            if (in == null) {
                throw new Exception("Recurso no encontrado: " + resourcePath);
            }
            Files.copy(in, destination, StandardCopyOption.REPLACE_EXISTING);
        }
    }
}