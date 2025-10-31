package org.caffeine.app;

import javafx.application.Application;
import javafx.scene.Scene;
import javafx.scene.web.WebView;
import javafx.stage.Stage;
import java.io.File;
import java.net.URL;

/**
 * App - Main JavaFX Application
 * Loads HTML/CSS/JS frontend and displays it in a WebView
 * Supports both local files and HTTP URLs (for development with hot-reload)
 */
public class App extends Application {
    private static String frontendPath;

    public static void launchApp(String path) {
        frontendPath = path;
        launch();
    }

    @Override
    public void start(Stage stage) throws Exception {
        stage.setTitle("Caffeine Application");
        stage.setWidth(1024);
        stage.setHeight(768);

        WebView webView = new WebView();
        String url;

        if (frontendPath != null && !frontendPath.isEmpty()) {
            // Check if it's a URL (HTTP)
            if (frontendPath.startsWith("http://") || frontendPath.startsWith("https://")) {
                url = frontendPath;
                System.out.println("Loading frontend from: " + url);
            } else {
                // Development mode - load from file system
                File frontendFile = new File(frontendPath, "index.html");
                if (frontendFile.exists()) {
                    url = frontendFile.toURI().toString();
                    System.out.println("Loading frontend from: " + url);
                } else {
                    url = new File(frontendPath).toURI().toString();
                }
            }
        } else {
            // Production mode - load embedded frontend
            URL resource = getClass().getResource("/frontend/index.html");
            if (resource != null) {
                url = resource.toString();
                System.out.println("Loading embedded frontend");
            } else {
                url = "about:blank";
            }
        }

        webView.getEngine().load(url);

        Scene scene = new Scene(webView);
        stage.setScene(scene);
        stage.show();
    }
}
