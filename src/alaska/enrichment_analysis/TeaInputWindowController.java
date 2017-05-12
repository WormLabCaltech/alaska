package alaska.enrichment_analysis;

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
 * Created by phoen on 4/8/2017.
 */


public class TeaInputWindowController {
    /**
     * Controller class for TeaInputWindow.
     * Manages all operations related to TEA.
     */

    // @FXML tag indicates target for injections according to fx:id in the .fxml file
    @FXML Label geneList_label;
    @FXML Label geneList_fileName;
    @FXML Label geneList_fileSize;
    @FXML TextField geneList_textField;
    @FXML Button geneList_browseBtn;

    @FXML Label title_label;
    @FXML TextField title_textField;

    @FXML Label type_label;
    @FXML ChoiceBox type_choiceBox;

    @FXML Label output_label;
    @FXML TextField output_textField;
    @FXML Button output_browseBtn;

    @FXML TitledPane optional_pane;

    @FXML CheckBox qValue_checkBox;
    @FXML Label qValue_label;
    @FXML TextField qValue_textField;

    @FXML CheckBox saveGraph_checkBox;

    @FXML
    public void geneListFilled() {
        if(!geneList_textField.getText().equals("")) {
            // Enable title text field
            title_textField.setDisable(false);
        } else {
            title_textField.setDisable(true);
        }
    }

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



    @FXML
    public void buttonHandler(ActionEvent ae) {
        /**
         * Handles all buttons in the TeaInputWindow.
         */
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
}
