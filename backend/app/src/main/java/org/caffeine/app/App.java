package org.caffeine.app;

import java.awt.BorderLayout;
import java.io.File;
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

        builder.setInstallDir(new File("jcef-bundle")); // default
        builder.setProgressHandler(new ConsoleProgressHandler()); // default
        builder.addJcefArgs("--disable-gpu"); // ejemplo
        builder.getCefSettings().windowless_rendering_enabled = false; // Cambiado a false para mostrar la ventana

        // Set an app handler. Do not use CefApp.addAppHandler(...), it may break on
        // macOS!
        builder.setAppHandler(new MavenCefAppHandlerAdapter() {
            // Override handler methods here if needed
        });

        // Build a CefApp instance using the configuration above
        CefApp app = null;
        try {
            app = builder.build();

            // --- Nuevo código para crear y mostrar la ventana del navegador ---
            JFrame frame = new JFrame("Caffeine Browser");
            frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
            frame.setSize(800, 600);
            // Crear un CefClient
            CefClient client = app.createClient();

            // Almacenar el CefBrowser en una variable, usando el CefClient
            CefBrowser browser = client.createBrowser("file:///home/juan/Escritorio/Caffeine/frontend/index.html",
                    false, false);
            frame.getContentPane().add(browser.getUIComponent(), BorderLayout.CENTER);
            frame.setVisible(true);

        } catch (Exception e) {
            e.printStackTrace();
            System.exit(1);
        }
    }
}
