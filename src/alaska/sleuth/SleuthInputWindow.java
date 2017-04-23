package alaska.sleuth;

import alaska.ContentWindow;

/**
 * Created by phoen on 4/20/2017.
 */
public class SleuthInputWindow extends ContentWindow {
    /**
     *  Class to be called when Sleuth wants to be shown.
     *  IMPORTANT: DO NOT CALL SleuthInputWindow.fxml WITHOUT USING THIS CLASS
     */

    public SleuthInputWindow() throws Exception {
        /**
         * Creating TeaInputWindow object will automatically launch a new window
         * to calculate required width & height.
         * See alaska.ContentWindow for details.
         */
        BEFORE_BUTTON_VISIBLE = true;
        BEFORE_BUTTON_TEXT = "Back";
        NEXT_BUTTON_VISIBLE = true;
        NEXT_BUTTON_TEXT = "Run Sleuth";
        LABEL_TEXT = "Sleuth";
        WRAPPER_PATH = "/alaska/MainWindow.fxml";
        FXML_PATH = "SleuthInputWindow.fxml";
        start();
    }
}
