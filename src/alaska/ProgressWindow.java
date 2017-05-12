package alaska;

import javafx.application.Platform;
import javafx.concurrent.Task;
import javafx.event.EventHandler;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.image.Image;
import javafx.stage.Stage;
import javafx.stage.WindowEvent;

import java.awt.*;
import java.net.URI;
import java.util.ArrayList;
import java.util.concurrent.TimeUnit;

/**
 * Created by phoen on 4/16/2017.
 */
public class ProgressWindow {
    /**
     * Class for handling progress windows.
     * Initializing this class creates a new progress window.
     */
    String FXML_PATH = "ProgressWindow.fxml";

    Label time_label;
    Label text_label;
    Label output_label;

    Stage progressStage;
    ScriptExecutor script;

    public ProgressWindow(ScriptExecutor script) {
        this.script = script;
        try {
            showWindow();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void showWindow() throws Exception {
        Parent progressNode = FXMLLoader.load(getClass().getResource(FXML_PATH));
        time_label = (Label) progressNode.lookup("#time_label");
        text_label = (Label) progressNode.lookup("#text_label");
        output_label = (Label) progressNode.lookup("#output_label");

        Scene progressScene = new Scene(progressNode);
        progressStage = new Stage();
        progressStage.setScene(progressScene);


        progressStage.setTitle("Running...");
        progressStage.centerOnScreen();
        progressStage.show();


        // Add closing event handler (needed to stop script from running
        EventHandler<WindowEvent> close = new EventHandler<WindowEvent>() {
            @Override
            public void handle(WindowEvent event) {
                close();
            }
        };
        progressStage.setOnCloseRequest(close);

        run();
    }

    public void close() {
        /**
         * To be called when closing the progress window
         */
        script.process.destroyForcibly();
        progressStage.close();
    }

    public void run() {
        /**
         * Runs the script and starts output listener to update output text on the window
         */
        startOutputListener();
        script.runScript();
    }

    private void startOutputListener() {
        /**
         * Starts output listener to capture script output
         */
        // Task that will loop while script is running (!script.terminated)
        Task<Void> outputTask = new Task<Void>() {
            @Override
            protected Void call() throws Exception {
                String output_old = output_label.getText();
                while(!script.terminated) {
                    String output = script.getOutput();
                    if(output.contains("#") && !output.equals(output_old)) {
                        // JavaFX GUI update must happen within the same thread as the GUI
                        // Use Platform.runLater
                        Platform.runLater(new Runnable() {
                            @Override
                            public void run() {
                                setOutputText(output.substring(output.indexOf("#")+1,output.length()-1));
                            }
                        });
                        output_old = output;
                    }else if((output.split(" ")[0].contains("ing") || output.startsWith("shrink"))
                                && !output.equals(output_old)) {
                        Platform.runLater(new Runnable() {
                            @Override
                            public void run() {
                                setOutputText(output);
                            }
                        });

                        // If -s option was selected and Shiny server has started, open web browser to url
                        /* TODO: Multi-platform browser support */
                        if(script.args.contains("-s") && output.startsWith("Listening")) {
                            String url = output.substring(output.indexOf("http"));
                            ArrayList<String> args = new ArrayList<String>();
                            args.add("google-chrome");
                            args.add(url);
                            ProcessBuilder builder = new ProcessBuilder();
                            builder.start();
                            /*
                            if(Desktop.isDesktopSupported()) {
                                try {
                                    Desktop desktop = Desktop.getDesktop();
                                    desktop.browse(new URI(url));
                                }catch (Exception e) {
                                    e.printStackTrace();
                                }
                            }
                            */
                        }
                    }
                    // Interval to run task in order to capture output
                    // Without this, GUI will overflow with requests
                    Thread.sleep(200);
                    System.out.println(output);
                }

                return null;
            }
        };

        // Task for elapsed time
        Task<Void> timeTask = new Task<Void>() {
            @Override
            protected Void call() throws Exception {
                long startTime = System.nanoTime();
                while(!script.terminated) {
                    Platform.runLater(new Runnable() {
                        @Override
                        public void run() {
                            long elapsedTime = System.nanoTime() - startTime;
                            long inSeconds = TimeUnit.NANOSECONDS.toSeconds(elapsedTime);
                            long minutes = inSeconds / 60;
                            long seconds = inSeconds % 60;
                            String formatted_min = String.format("%02d", minutes);
                            String formatted_sec = String.format("%02d", seconds);
                            setTimeText(formatted_min + ":" + formatted_sec);
                        }
                    });
                    Thread.sleep(1000);
                }

                // Close progress window when script has finished running
                Platform.runLater(new Runnable() {
                    @Override
                    public void run() {
                        setOutputText(script.scriptName + " finished");
                        progressStage.close();
                    }
                });

                return null;
            }
        };

        // Start threads
        Thread outputThread = new Thread(outputTask);
        outputThread.setDaemon(true);

        Thread timeThread = new Thread(timeTask);
        timeThread.setDaemon(true);

        outputThread.start();
        timeThread.start();


    }

    private void setTimeText(String time) {
        /**
         * Sets the elapsed time on the window
         */
        time_label.setText("Elapsed Time: " + time);
    }

    private void setOutputText(String output) {
        /**
         * Sets the output text on the window
         */
        output_label.setText(output);
    }
}
