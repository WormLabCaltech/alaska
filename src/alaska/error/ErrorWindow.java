package alaska.error;

import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.Label;
import javafx.stage.Stage;

/**
 * Class for error window management
 * ONLY TO BE CALLED BY AlaskaException CLASS
 * TODO: couple with Logger
 */
public class ErrorWindow {
    String message;         // error message
    int code;               // error code
    Exception exception;    // exception

    /**
     * Constructor.
     * Opens error window.
     * @param   message     (String) error message
     * @param   code        (int) error code
     * @param   exception   (Exception) exception
     */
    public ErrorWindow(String message, int code, Exception exception) {
        /* begin initializing refernces */
        this.message = message;
        this.code = code;
        this.exception = exception;
        /* end initializing references */

        showWindow();   // open window
    }

    /**
     * Opens error window.
     */
    private void showWindow() {
        try {
            /* begin initializing references */
            Parent errorNode = FXMLLoader.load(getClass().getResource("ErrorWindow.fxml"));
            Label error_code_label = (Label) errorNode.lookup("#error_code_label");
            Label error_message_label = (Label) errorNode.lookup("#error_message_label");
            Scene errorScene = new Scene(errorNode);
            Stage errorStage = new Stage();
            /* end initializing references */

            // show window
            errorStage.setScene(errorScene);
            errorStage.setTitle("Warning!");
            error_code_label.setText("Error code: " + Integer.toString(code));
            error_message_label.setText(message);
            errorStage.show();

        } catch (Exception e) {
            System.out.println("Unknown error occurred while opening ErrorWindow");
        }

    }

}
