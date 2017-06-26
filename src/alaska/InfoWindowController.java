package alaska;

import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.scene.control.Button;
import javafx.scene.control.TextField;
import javafx.stage.DirectoryChooser;
import javafx.stage.Stage;

import java.io.File;

/**
 * Controller class of InfoWindow
 */
public class InfoWindowController {
    @FXML TextField title_textField;    // project title
    @FXML TextField home_textField;     // home directory
    @FXML Button home_browseBtn;        // home directory browse button

    /**
     * Function to enable/disable home directory & browse button.
     * Project title field must be occupied for home directory text field and
     * home directory browse button to be enabled.
     * TODO: is there a better way to do this?
     */
    @FXML
    public void titleField() {
        if(!title_textField.getText().equals("")) {
            home_textField.setDisable(false);
            home_browseBtn.setDisable(false);
        } else {
            home_textField.setDisable(true);
            home_browseBtn.setDisable(true);
            home_textField.setText("");
        }
    }

    /**
     * Handles home directory browse button.
     *
     * @param ae
     */
    @FXML
    public void buttonHandler(ActionEvent ae) {
        // Open browse window
        DirectoryChooser directoryChooser = new DirectoryChooser();
        directoryChooser.setTitle("Choose Project Home Directory");
        File home = directoryChooser.showDialog(new Stage());

        // Set directory
        home_textField.setText(home.getPath() + "/" + title_textField.getText() + "/");
    }
}
