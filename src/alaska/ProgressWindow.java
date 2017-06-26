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
 * Class for handling progress windows.
 * Initializing this class creates a new progress window.
 */
public class ProgressWindow {
    String FXML_PATH = "ProgressWindow.fxml";   // path to FXML file

    Label time_label;       // time text
    Label text_label;       // description text
    Label output_label;     // script output text
    String title;           // window title

    Stage progressStage;    // window
    ScriptExecutor script;  // script executor

    /**
     * Constructor.
     * Opens progress window.
     *
     * @param   script    (ScriptExecutor) of the script to execute
     * @param   title     (String) window title
     */
    public ProgressWindow(ScriptExecutor script, String title) {
        this.script = script;
        this.title = title;
        try {
            showWindow();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * Opens progress window.
     * Called by constructor.
     *
     * @throws Exception
     */
    public void showWindow() throws Exception {
        /* begin initializing references */
        Parent progressNode = FXMLLoader.load(getClass().getResource(FXML_PATH));
        time_label = (Label) progressNode.lookup("#time_label");
        text_label = (Label) progressNode.lookup("#text_label");
        output_label = (Label) progressNode.lookup("#output_label");
        /* end initializing references */

        // set scene and show window
        Scene progressScene = new Scene(progressNode);
        progressStage = new Stage();
        progressStage.setScene(progressScene);
        progressStage.setTitle(title);
        progressStage.centerOnScreen();
        progressStage.show();


        // Add closing event handler (needed to stop script from running indefinitely)
        EventHandler<WindowEvent> close = new EventHandler<WindowEvent>() {
            @Override
            public void handle(WindowEvent event) {
                close();
            }
        };
        progressStage.setOnCloseRequest(close);

        run();  // run script
    }

    /**
     * Forces the script to terminate and the window to close.
     * MUST BE CALLED WHEN CLOSING WINDOW
     */
    public void close() {
        script.process.destroyForcibly();
        progressStage.close();
    }

    /**
     * Runs the script and starts output listener to update output text on the window.
     */
    public void run() {
        startOutputListener();
        script.runScript();
    }

    /**
     * Starts the output listener.
     */
    private void startOutputListener() {
        // Task that will loop while script is running (!script.terminated)
        /* begin outputTask TODO: put in separate function? */
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
                                setOutputText(output.substring(output.indexOf("#")+1,
                                        output.length()-1));
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
        /* end outputTask */

        // Task for elapsed time
        /* begin timeTask TODO: put in separate function? */
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
                    System.out.println(script.terminated);
                }

                // Close progress window when script has finished running
                // TODO: not tested
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
        /* end timeTask */

        // Start threads
        Thread outputThread = new Thread(outputTask);
        outputThread.setDaemon(true);
        Thread timeThread = new Thread(timeTask);
        timeThread.setDaemon(true);
        outputThread.start();
        timeThread.start();


    }

    /**
     * Sets the elapsed time on the window.
     * @param   time    (String) time in MM:SS
     */
    private void setTimeText(String time) {
        time_label.setText("Elapsed Time: " + time);
    }

    /**
     * Sets the output text on the window.
     * @param    output (String) script output
     */
    public void setOutputText(String output) {
        output_label.setText(output);
    }
}
