package alaska.error;

import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.Label;
import javafx.stage.Stage;

/**
 * Created by phoen on 5/15/2017.
 */
public class ErrorWindow {
    /**
     * Class for error window management
     * ONLY TO BE CALLED BY AlaskaException CLASS
     */
    String message;
    int code;
    Exception exception;

    public ErrorWindow(String message, int code, Exception exception) {
        this.message = message;
        this.code = code;
        this.exception = exception;
        showWindow();
    }

    private void showWindow() {
        try {
            Parent errorNode = FXMLLoader.load(getClass().getResource("ErrorWindow.fxml"));
            Label error_code_label = (Label) errorNode.lookup("#error_code_label");
            Label error_message_label = (Label) errorNode.lookup("#error_message_label");
            Scene errorScene = new Scene(errorNode);
            Stage errorStage = new Stage();
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
