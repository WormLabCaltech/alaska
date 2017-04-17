package alaska; /**
 * Created by lioscro on 4/7/17.
 */
import alaska.enrichment_analysis.TeaInputWindowController;
import javafx.event.ActionEvent;
import javafx.fxml.*;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.layout.*;

import javax.swing.*;
import java.net.URL;
import java.util.ResourceBundle;

public class MainWindowController {
    /**
     * JavaFX controller method for MainWindow.
     * Controls all actionevents (i.e. buttons, textfields, etc.)
     */
    @FXML FlowPane content_pane;

    @FXML Label currentStep_label;
    @FXML Button before_button;
    @FXML Button next_button;

    @FXML
    public void beforeBtnHandler() {
        /**
         * PLACEHOLDER
         * Handler method for the before button
         */
    }

    @FXML
    public void nextBtnHandler() {
        /**
         * Handler method for the next button
         */
        if(currentStep_label.getText().contains("Enrichment")) {
            // Run Enrichment Analysis
            ((Button) content_pane.lookup("#run")).fire();
        }
    }


}
