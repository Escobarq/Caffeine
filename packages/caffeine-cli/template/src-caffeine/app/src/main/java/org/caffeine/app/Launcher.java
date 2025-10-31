package org.caffeine.app;

/**
 * Launcher - Entry point for JAR
 * This class bridges the frontend and backend
 */
public class Launcher {
    public static void main(String[] args) {
        String frontendPath = args.length > 0 ? args[0] : null;

        if (frontendPath != null && !frontendPath.isEmpty()) {
            // Development mode
            System.out.println("Starting Caffeine in development mode...");
            System.out.println("Frontend path: " + frontendPath);
            App.launchApp(frontendPath);
        } else {
            // Production mode - embedded frontend
            System.out.println("Starting Caffeine in production mode...");
            App.launchApp(null);
        }
    }
}
