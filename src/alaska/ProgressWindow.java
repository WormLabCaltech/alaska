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
        Task<Void> task = new Task<Void>() {
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
                    }
                    // Interval to run task in order to capture output
                    // Without this, GUI will overflow with requests
                    Thread.sleep(100);
                }
                return null;
            }
        };

        new Thread(task).start();
    }

    private void setOutputText(String output) {
        /**
         * Sets the output text on the window
         */
        output_label.setText(output);
    }
}
