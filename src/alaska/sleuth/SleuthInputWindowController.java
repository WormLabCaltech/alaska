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
 * Controller class for SleuthInputWindow
 */
public class SleuthInputWindowController {
    @FXML TextField title_textField;    // project title

    @FXML TextField matrix_textField;   // rna seq matrix path
    @FXML Button matrix_browseBtn;      // rna seq matrix browse button

    @FXML TextField output_textField;   // output directory path
    @FXML Button output_browseBtn;      // output directory browse button

    /**
     * Called when project title changes.
     * Enables/disables downstream input accordingly.
     * TODO: is there a better way to do this?
     */
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

    /**
     * Called when rna seq matrix path changes.
     * Enables/disables downstream input accordingly.
     * TODO: is there a better way to do this?
     */
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

    /**
     * Hanles all browse buttons.
     *
     * @param   ae  (ActionEvent) related to event
     *
     * TODO: is there a better way to do this?
     */
    @FXML
    public void buttonHandler(ActionEvent ae) {
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

    /**
     * Automatically populate fields.
     * TODO: is there a better way to do this?
     */
    @FXML public void initialize() {
        title_textField.setText(Alaska.title);
        matrix_textField.setText(Alaska.homeDir + "rna_seq_info.txt");
        output_textField.setText(Alaska.homeDir + "sleuth");
        matrix_textField.setDisable(false);
        matrix_browseBtn.setDisable(false);
        output_browseBtn.setDisable(false);
    }
}
