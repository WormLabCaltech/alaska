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
import java.nio.file.Path;
import java.util.ResourceBundle;

/**
 * Created by phoen on 4/8/2017.
 */


public class TeaInputWindowController implements Initializable{
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
    public void buttonHandler(ActionEvent ae) {

        switch(((Button) ae.getSource()).getId()) {
            case "geneList_browseBtn":
                FileChooser fileChooser = new FileChooser();
                fileChooser.setTitle("Open Gene File");
                File geneFile = fileChooser.showOpenDialog(new Stage());
                geneList_fileName.setText(geneFile.getName());
                geneList_fileSize.setText(Long.toString(geneFile.length()) + " bytes");
                geneList_textField.setText(geneFile.getPath());
                output_textField.setText(
                        geneFile.getPath().substring(0, geneFile.getPath().lastIndexOf("\\")+1));
                break;
            case "output_browseBtn":
                DirectoryChooser directoryChooser = new DirectoryChooser();
                directoryChooser.setTitle("Choose Output Directory");
                File outputPath = directoryChooser.showDialog(new Stage());
                output_textField.setText(outputPath.getPath());
                break;
        }
    }

    @Override
    public void initialize(URL fxmlFileLocation, ResourceBundle resources) {
        type_choiceBox.setItems(FXCollections.observableArrayList(choices));
    }
}
