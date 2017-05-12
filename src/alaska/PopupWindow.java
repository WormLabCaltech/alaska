package alaska;

import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.image.Image;
import javafx.stage.Stage;
import sun.font.Script;

import java.io.IOException;

/**
 * Created by phoen on 4/16/2017.
 */
public class PopupWindow {
    /**
     * Class for handling popup windows.
     * Initializing this class creates a new popup window.
     */

    String TITLE;
    String TEXT;
    Image IMAGE;
    boolean LEFT_BUTTON_VISIBLE;
    boolean RIGHT_BUTTON_VISIBLE;
    String LEFT_BUTTON_TEXT;
    String RIGHT_BUTTON_TEXT;
    String FXML_PATH = "PopupWindow.fxml";
    Stage popupStage;

    Label text_label;
    Button left_button;
    Button right_button;

    public PopupWindow(String title, String text, boolean left_visible, boolean right_visible,
                       String left_text, String right_text) {
        TITLE = title;
        TEXT = text;
        LEFT_BUTTON_VISIBLE = left_visible;
        RIGHT_BUTTON_VISIBLE = right_visible;
        LEFT_BUTTON_TEXT = left_text;
        RIGHT_BUTTON_TEXT = right_text;
        try {
            showWindow();
        } catch(Exception e) {
            e.printStackTrace();
            System.out.println("Unknown error occured while opening popup window " + TITLE + ".");
        }
    }

    public void showWindow() throws Exception{
        /**
         * Creates and shows the popup window
         */
        Parent popupNode = FXMLLoader.load(getClass().getResource(FXML_PATH));

        // Initialize references
        left_button = (Button) popupNode.lookup("#popup_left_button");
        right_button = (Button) popupNode.lookup("#popup_right_button");
        text_label = (Label) popupNode.lookup("#popup_label");

        text_label.setText(TEXT);
        left_button.setVisible(LEFT_BUTTON_VISIBLE);
        right_button.setVisible(RIGHT_BUTTON_VISIBLE);
        left_button.setText(LEFT_BUTTON_TEXT);
        right_button.setText(RIGHT_BUTTON_TEXT);

        Scene popupScene = new Scene(popupNode);
        popupStage = new Stage();
        popupStage.setScene(popupScene);

        popupStage.setTitle(TITLE);
        popupStage.centerOnScreen();
        popupStage.show();
    }

    public void changeText(String text) {
        text_label.setText(text);
    }

    public void hook(ScriptExecutor script) {
        script.runScript();

        long startTime = System.nanoTime();
        while(!script.terminated) {
            long elapsed = System.nanoTime() - startTime;
            changeText(Long.toString(elapsed));
        }
    }

    public void setImage(Image image) {
        IMAGE = image;
    }
}
