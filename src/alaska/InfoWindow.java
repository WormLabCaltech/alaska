package alaska;

/**
 * Created by lioscro on 5/25/17.
 */
public class InfoWindow extends ContentWindow {
    public InfoWindow() throws Exception {
        BEFORE_BUTTON_VISIBLE = true;
        BEFORE_BUTTON_TEXT = "Back";
        NEXT_BUTTON_VISIBLE = true;
        NEXT_BUTTON_TEXT = "";
        LABEL_TEXT = "Project Information";
        WRAPPER_PATH = "/alaska/MainWindow.fxml";
        FXML_PATH = "InfoWindow.fxml";
        start();
    }
}
