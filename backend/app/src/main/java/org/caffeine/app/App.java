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

        // Configurar el directorio donde se instalarán los binarios de Chromium
        builder.setInstallDir(new File("jcef-bundle"));
        builder.setProgressHandler(new ConsoleProgressHandler());

        // Argumentos para optimizar JCEF
        builder.addJcefArgs("--disable-gpu");

        // Configuración de CEF
        builder.getCefSettings().windowless_rendering_enabled = false;

        // Configurar el manejador de la aplicación
        builder.setAppHandler(new MavenCefAppHandlerAdapter() {
            // Aquí puedes agregar manejadores personalizados si los necesitas
        });

        CefApp app = null;
        try {
            // Construir la aplicación CEF
            app = builder.build();

            JFrame frame = new JFrame("Caffeine Framework");
            frame.setDefaultCloseOperation(JFrame.DO_NOTHING_ON_CLOSE);
            frame.setSize(1200, 800);
            frame.setLocationRelativeTo(null);

            // Crear el cliente y el navegador
            CefClient client = app.createClient();
            CefBrowser browser = client.createBrowser(
                    "file:///home/juan/Escritorio/Caffeine/frontend/index.html",
                    false,
                    false);

            // Agregar el navegador a la ventana
            frame.getContentPane().add(browser.getUIComponent(), BorderLayout.CENTER);

            // Manejar el cierre de la ventana correctamente
            final CefApp finalApp = app;
            frame.addWindowListener(new java.awt.event.WindowAdapter() {
                @Override
                public void windowClosing(java.awt.event.WindowEvent windowEvent) {
                    browser.close(true);
                    finalApp.dispose();
                    frame.dispose();
                    System.exit(0);
                }
            });

            // Mostrar la ventana
            frame.setVisible(true);
        } catch (Exception e) {
            System.err.println("Error al iniciar la aplicación:");
            e.printStackTrace();
            System.exit(1);
        }
    }
}