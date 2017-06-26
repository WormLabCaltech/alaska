package alaska.enrichment_analysis;

import alaska.Alaska;
import alaska.ScriptExecutor;
import javafx.collections.FXCollections;
import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.*;
import javafx.stage.DirectoryChooser;
import javafx.stage.FileChooser;
import javafx.stage.Stage;
import sun.font.Script;

import java.io.File;
import java.net.URL;
import java.util.ResourceBundle;

/**
 * Controller class for TeaInputWindow.
 * Manages all operations related to TEA.
 */
public class TeaInputWindowController {
    @FXML Label geneList_fileName;          // gene list file name text
    @FXML Label geneList_fileSize;          // gene list file size text
    @FXML TextField geneList_textField;     // gene list file path textfield
    @FXML Button geneList_browseBtn;        // gene list browse button

    @FXML TextField title_textField;        // project title textfield

    @FXML TextField output_textField;       // output directory textfield
    @FXML Button output_browseBtn;          // output direcgtory browse button

    @FXML TitledPane optional_pane;         // additional options pane

    @FXML CheckBox qValue_checkBox;         // q value checkbox
    @FXML Label qValue_label;               // q value text
    @FXML TextField qValue_textField;       // q value textfield

    @FXML CheckBox saveGraph_checkBox;      // save graph checkbox

    /**
     * Called when gene list file path textfield changes.
     * Enables/disables project title textfield accordingly.
     * TODO: is there a better way to do this?
     */
    @FXML
    public void geneListFilled() {
        if(!geneList_textField.getText().equals("")) {
            // Enable title text field
            title_textField.setDisable(false);
        } else {
            title_textField.setDisable(true);
        }
    }

    /**
     * Called when project title changes.
     * Enables/disables downstream fields accordingly.
     * TODO: is there a better way to do this?
     */
    @FXML
    public void titleChanged() {
        if(!title_textField.getText().equals("")) {
            // Enable output text field and browse button
            output_textField.setDisable(false);
            output_browseBtn.setDisable(false);

            File output = new File(geneList_textField.getText());
            String outputDir = output.getParentFile().getPath();
            outputDir += "/" + title_textField.getText() + "/enrichment_analysis/";
            output_textField.setText(outputDir);
            optional_pane.setDisable(false);
            optional_pane.setExpanded(true);
        } else {
            output_textField.setDisable(true);
            output_browseBtn.setDisable(true);
            output_textField.setText("");
            optional_pane.setDisable(true);
            optional_pane.setExpanded(false);
        }
    }

    /**
     * Called when output directory changes.
     * TODO: is there a better way to do this?
     */
    @FXML
    public void outputFilled() {
        if(!output_textField.getText().equals("")) {
            optional_pane.setDisable(false);
            optional_pane.setExpanded(true);
        } else {
            optional_pane.setExpanded(false);
            optional_pane.setDisable(true);
        }
    }


    /**
     * Handles browse buttons.
     * @param   ae  (ActionEvent) related to event
     */
    @FXML
    public void buttonHandler(ActionEvent ae) {
        switch(((Button) ae.getSource()).getId()) {
            case "geneList_browseBtn":
                // Open browse window
                FileChooser fileChooser = new FileChooser();
                fileChooser.setTitle("Open Gene File");
                File geneFile = fileChooser.showOpenDialog(new Stage());

                // Set labels & text field according to selected file
                geneList_fileName.setText(geneFile.getName());
                geneList_fileSize.setText(Long.toString(geneFile.length()) + " bytes");

                // Set paths for genelist
                String geneFilePath = geneFile.getPath();
                geneList_textField.setText(geneFilePath);
                title_textField.setDisable(false);
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
                optional_pane.setDisable(false);
                optional_pane.setExpanded(true);
                break;
        }
    }

    /**
     * Automatically occupy project title field with the title
     * TODO: is there a better way to do this?
     */
    @FXML public void initialize() {
        title_textField.setText(Alaska.title);
    }
}
