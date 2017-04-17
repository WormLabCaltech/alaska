package alaska.enrichment_analysis;

import alaska.PythonScriptExecutor;
import javafx.collections.FXCollections;
import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.*;
import javafx.stage.DirectoryChooser;
import javafx.stage.FileChooser;
import javafx.stage.Stage;

import java.io.File;
import java.net.URL;
import java.util.ResourceBundle;

/**
 * Created by phoen on 4/8/2017.
 */


public class TeaInputWindowController implements Initializable{
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
    @FXML String[] choices = {"Tissue", "Phenotype", "Gene Ontology (GO)"};

    @FXML Label output_label;
    @FXML TextField output_textField;
    @FXML Button output_browseBtn;

    @FXML CheckBox qValue_checkBox;
    @FXML Label qValue_label;
    @FXML TextField qValue_textField;

    @FXML CheckBox saveGraph_checkBox;

    @FXML
    public void run() {
        /**
         * On Action for Run Enrichment Analysis button.
         * Runs enrichment analysis using parameters entered in the window.
         *
         * TODO: Add meaningful notification when field(s) are not completed. (popup?)
         * TODO: change absolute path to tea script into relative path
         */
        System.out.println("Running");
        String choice = type_choiceBox.getValue().toString();
        String analysisType = "";
        System.out.println(choice);
        if(choice.equals("Tissue")) {
            analysisType = "tissue";
        } else if(choice.equals("Phenotype")) {
            analysisType = "phenotype";
        } else if(choice.equals("Gene Ontology (GO)")) {
            analysisType = "go";
        }

        // Create specified output directory if it doesn't exist (which is most likely).
        File outputDirectory = new File(output_textField.getText());
        System.out.println(outputDirectory.getPath());
        System.out.println(outputDirectory.exists());
        if (!outputDirectory.exists()) {
            try {
                outputDirectory.mkdirs();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        // Run TEA in thread to prevent blocking
        String[] args = {geneList_textField.getText(), output_textField.getText() + "result", analysisType, "-s"};
        for(int i = 0; i<args.length; i++) {
            System.out.println(args[i]);
        }

        PythonScriptExecutor tea = new PythonScriptExecutor("C:\\Github\\Repos\\alaska\\TEA Integration\\src\\hypergeometricTests.py", args);
        Thread thread = new Thread(tea, "Enrichment Analysis");
        thread.start();
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
                geneList_textField.setText(geneFile.getPath());
                break;
            case "output_browseBtn":
                // Open browse window
                DirectoryChooser directoryChooser = new DirectoryChooser();
                directoryChooser.setTitle("Choose Output Directory");
                File outputPath = directoryChooser.showDialog(new Stage());

                // Automatically add subdirectories to save analysis
                String outputDirectory = outputPath.getPath();
                outputDirectory += title_textField.getText() + "\\";
                String choice = type_choiceBox.getValue().toString();
                if(choice.equals("Tissue")) {
                outputDirectory += "TEA\\";
                } else if(choice.equals("Phenotype")) {
                    outputDirectory += "PEA\\";
                } else if(choice.equals("Gene Ontology (GO)")) {
                    outputDirectory += "GEA\\";
                }
                output_textField.setText(outputDirectory);
                break;
        }
    }

    @Override
    public void initialize(URL fxmlFileLocation, ResourceBundle resources) {
        /**
         * Automatically called once the scene is initialized.
         */
        // Add enrichment analysis types to choice box
        type_choiceBox.setItems(FXCollections.observableArrayList(choices));
    }
}
