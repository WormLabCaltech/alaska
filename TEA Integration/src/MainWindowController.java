/**
 * Created by lioscro on 4/7/17.
 */
import javafx.event.ActionEvent;
import javafx.fxml.*;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.layout.*;

import javax.swing.*;
import java.net.URL;
import java.util.ResourceBundle;

public class MainWindowController implements Initializable {
    @FXML // fx:id="MainPane"
    FlowPane contentPane;


    @Override //called by FXMLLoader of MainWindow Class
    public void initialize(URL fxmlFileLocation, ResourceBundle resources) {
    }

    public void nextBtnHandler(ActionEvent ae) {
        if(((Button) ae.getSource()).getText().startsWith("Run Enrichment")) {

        }
    }
}
