package alaska;

import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.image.Image;
import javafx.stage.Stage;

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

    public ProgressWindow(ScriptExecutor script) {

    }

    public void showWindow() throws Exception {
        Parent progressNode = FXMLLoader.load(getClass().getResource(FXML_PATH));
        time_label = (Label) progressNode.lookup("#time_label");
        text_label = (Label) progressNode.lookup("#text_label");

        Scene progressScene = new Scene(progressNode);
    }
}
