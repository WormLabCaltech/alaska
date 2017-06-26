package alaska.enrichment_analysis;

import alaska.ContentWindow;
import javafx.application.Application;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.Button;
import javafx.scene.layout.FlowPane;
import javafx.stage.Stage;

/**
 * Child of ContentWindow
 * Class to be called when Enrichment Analysis wants to be shown.
 * IMPORTANT: DO NOT LOAD TeaInputWindow.fxml WITHOUT USING THIS CLASS
 */
public class TeaInputWindow extends ContentWindow {
    public static String title;

    /**
     * Creating TeaInputWindow object will automatically launch a new window
     * to calculate required width & height.
     * See alaska.ContentWindow for details.
     *
     * @throws Exception
     */
    public TeaInputWindow() throws Exception {
        BEFORE_BUTTON_VISIBLE = true;
        BEFORE_BUTTON_TEXT = "Back";
        NEXT_BUTTON_VISIBLE = true;
        NEXT_BUTTON_TEXT = "Run Enrichment Analysis";
        LABEL_TEXT = "Enrichment\nAnalysis";
        WRAPPER_PATH = "/alaska/MainWindow.fxml";
        FXML_PATH = "TeaInputWindow.fxml";
        start();
    }

}
