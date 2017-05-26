package alaska.sleuth;

import alaska.Alaska;
import javafx.event.ActionEvent;
import javafx.event.Event;
import javafx.fxml.FXML;
import javafx.scene.control.Button;
import javafx.scene.control.TextField;
import javafx.scene.input.KeyEvent;
import javafx.stage.DirectoryChooser;
import javafx.stage.FileChooser;
import javafx.stage.Stage;

import java.io.File;
import java.security.Key;

/**
 * Created by phoen on 4/20/2017.
 */
public class SleuthInputWindowController {
    @FXML TextField title_textField;

    @FXML TextField matrix_textField;
    @FXML Button matrix_browseBtn;

    @FXML TextField output_textField;
    @FXML Button output_browseBtn;

    @FXML
    public void titleChanged() {
        if (!title_textField.getText().equals("")) {
            // Enable output text field and browse button
            matrix_textField.setDisable(false);
            matrix_browseBtn.setDisable(false);
        } else {
            matrix_textField.setDisable(true);
            matrix_browseBtn.setDisable(true);
            matrix_textField.setText("");
        }
    }

    @FXML
    public void matrixFilled() {
        if(!matrix_textField.getText().equals("")) {
            output_textField.setDisable(false);
            output_browseBtn.setDisable(false);
        } else {
            output_textField.setDisable(true);
            output_textField.setDisable(true);
            output_textField.setText("");
        }
    }

    @FXML
    public void buttonHandler(ActionEvent ae) {
        /**
         * Handles all buttons in the Sleuth Input Window.
         */
        switch(((Button) ae.getSource()).getId()) {
            case "matrix_browseBtn":
                // Open browse window
                FileChooser fileChooser = new FileChooser();
                fileChooser.setTitle("Open RNA-seq Design Matrix");
                File matrixFile = fileChooser.showOpenDialog(new Stage());

                // Set paths for design matrix
                String matrixFilePath = matrixFile.getPath();
                matrix_textField.setText(matrixFilePath);
                output_textField.setDisable(false);
                output_browseBtn.setDisable(false);

                // Automatically set output directory
                output_textField.setText(matrixFile.getParent() + "/Sleuth/");
                break;
            case "output_browseBtn":
                // Open browse window
                DirectoryChooser directoryChooser = new DirectoryChooser();
                directoryChooser.setTitle("Choose Output Directory");
                File output = directoryChooser.showDialog(new Stage());

                // Automatically add subdirectories to save analysis
                String outputDirectory = output.getPath();
                outputDirectory += "/" + title_textField.getText() + "/";
                output_textField.setText(outputDirectory);
                break;
        }
    }

    @FXML public void initialize() {
        title_textField.setText(Alaska.title);
    }
}
