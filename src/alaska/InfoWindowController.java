package alaska;

import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.scene.control.Button;
import javafx.scene.control.TextField;
import javafx.stage.DirectoryChooser;
import javafx.stage.Stage;

import java.io.File;

/**
 * Created by lioscro on 5/25/17.
 */
public class InfoWindowController {
    /**
     * Manages project information window
     */
    @FXML TextField title_textField;
    @FXML TextField home_textField;
    @FXML Button home_browseBtn;

    @FXML
    public void titleFileld() {
        if(!title_textField.getText().equals("")) {
            home_textField.setDisable(false);
            home_browseBtn.setDisable(false);
        } else {
            home_textField.setDisable(true);
            home_browseBtn.setDisable(true);
            home_textField.setText("");
        }
    }

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
