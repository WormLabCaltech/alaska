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
 * Class for handling popup windows.
 * Initializing this class creates a new popup window.
 */
public class PopupWindow {
    String TITLE;                               // window title
    String TEXT;                                // window text
    Image IMAGE;                                // image to show
    boolean LEFT_BUTTON_VISIBLE;                // whether left button is visible
    boolean RIGHT_BUTTON_VISIBLE;               // whether right button is visible
    String LEFT_BUTTON_TEXT;                    // left button label
    String RIGHT_BUTTON_TEXT;                   // right button label
    String FXML_PATH = "PopupWindow.fxml";      // path to FXML file
    Stage popupStage;                           // window

    Label text_label;                           // window text
    Button left_button;                         // left button
    Button right_button;                        // right button

    /**
     * Constructor.
     * Opens popup window.
     *
     * @param title         (String) window title
     * @param text          (String) window text
     * @param left_visible  (boolean) whether left button is visible
     * @param right_visible (boolean) whether right button is visible
     * @param left_text     (String) left button label
     * @param right_text    (String) right button label
     */
    public PopupWindow(String title, String text, boolean left_visible, boolean right_visible,
                       String left_text, String right_text) {
        /* begin initializing values */
        TITLE = title;
        TEXT = text;
        LEFT_BUTTON_VISIBLE = left_visible;
        RIGHT_BUTTON_VISIBLE = right_visible;
        LEFT_BUTTON_TEXT = left_text;
        RIGHT_BUTTON_TEXT = right_text;
        /* end initializing values */

        // open window
        try {
            showWindow();
        } catch(Exception e) {
            e.printStackTrace();
            System.out.println("Unknown error occured while opening popup window " + TITLE + ".");
        }
    }

    /**
     * Creates and shows popup window.
     * @throws Exception
     */
    public void showWindow() throws Exception{
        /* begin initializing references */
        Parent popupNode = FXMLLoader.load(getClass().getResource(FXML_PATH));
        left_button = (Button) popupNode.lookup("#popup_left_button");
        right_button = (Button) popupNode.lookup("#popup_right_button");
        text_label = (Label) popupNode.lookup("#popup_label");
        /* end initializing references */

        // set properties
        text_label.setText(TEXT);
        left_button.setVisible(LEFT_BUTTON_VISIBLE);
        right_button.setVisible(RIGHT_BUTTON_VISIBLE);
        left_button.setText(LEFT_BUTTON_TEXT);
        right_button.setText(RIGHT_BUTTON_TEXT);

        // show window
        Scene popupScene = new Scene(popupNode);
        popupStage = new Stage();
        popupStage.setScene(popupScene);
        popupStage.setTitle(TITLE);
        popupStage.centerOnScreen();
        popupStage.show();
    }

    /**
     * Change window text.
     * @param   text    (String) window text
     */
    public void changeText(String text) {
        text_label.setText(text);
    }

    /**
     * Set window image.
     * @param   image   (Image) window image
     *
     * TODO: implement
     */
    public void setImage(Image image) {
        IMAGE = image;
    }
}
