/**
 * Created by lioscro on 4/7/17.
 * Main application window.
 */

import com.sun.javafx.fxml.builder.JavaFXSceneBuilder;
import javafx.application.Application;
import javafx.fxml.FXMLLoader;
import javafx.scene.Node;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.SubScene;
import javafx.scene.control.Button;
import javafx.scene.layout.*;
import javafx.stage.Stage;

public class MainWindow extends Application {

    Parent wrappingNode;
    Stage primaryStage;
    Scene primaryScene;
    FlowPane contentPane;
    Button beforeBtn;
    Button nextbtn;

    @Override
    public void start(Stage primaryStage) throws Exception{
        /**
         * Called by launch(args) in the main(String[] args) method.
         * Sets the primary stage (primary application window) and sets the initial scene.
         */
        // Initiate References
        this.wrappingNode = FXMLLoader.load(getClass().getResource("MainWindow.fxml"));
        this.primaryStage = primaryStage;
        this.contentPane = (FlowPane) this.wrappingNode.lookup("#ContentPane");
        this.beforeBtn = (Button) this.wrappingNode.lookup("#beforeBtn");
        this.nextbtn = (Button) this.wrappingNode.lookup("#nextBtn");
        this.primaryScene = new Scene(this.wrappingNode);

        this.primaryStage.setTitle("Tissue Enrichment Analysis");
        this.primaryStage.setScene(this.primaryScene);
        this.primaryStage.show();

        // What to show right after the window is opened
        changeContentPane("TeaInputWindow.fxml");


    }

    public static void main(String[] args) {
        launch(args);
    }

    public void changeContentPane(String fxmlFile) throws Exception{
        /**
         * Changes what is shown on the content pane.
         * Dynamically resizes window to accomodate new content.
         */

        // Load FXML files
        Parent wrappingNode = FXMLLoader.load(getClass().getResource("MainWindow.fxml"));
        Parent contentNode = FXMLLoader.load(getClass().getResource(fxmlFile));

        // Inject content to temporary content pane
        ((FlowPane) wrappingNode.lookup("#ContentPane")).getChildren().setAll(contentNode);

        // Temporary Stage to calculate required window height & width
        Stage tempStage = new Stage();
        tempStage.setScene(new Scene(wrappingNode));
        // This Stage should not be seen by user
        tempStage.setOpacity(0);
        tempStage.show();

        double tempHeight = tempStage.getHeight();
        double tempWidth = tempStage.getWidth();
        tempStage.close();

        //Set appropriate window size and inject new content to content pane
        this.primaryStage.setHeight(tempHeight);
        this.primaryStage.setWidth(tempWidth);
        this.contentPane.getChildren().setAll(contentNode);

    }
}
