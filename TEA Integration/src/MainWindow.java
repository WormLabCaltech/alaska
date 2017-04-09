/**
 * Created by lioscro on 4/7/17.
 */

import javafx.application.Application;
import javafx.fxml.FXMLLoader;
import javafx.scene.Node;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.SubScene;
import javafx.scene.layout.*;
import javafx.stage.Stage;

public class MainWindow extends Application {

    Parent wrappingNode;
    Stage primaryStage;
    Scene primaryScene;
    FlowPane contentPane;

    @Override
    public void start(Stage primaryStage) throws Exception{
        // Initiate References
        this.wrappingNode = FXMLLoader.load(getClass().getResource("MainWindow.fxml"));
        this.primaryStage = primaryStage;
        this.contentPane = (FlowPane) this.wrappingNode.lookup("#ContentPane");
        this.primaryScene = new Scene(this.wrappingNode);

        this.primaryStage.setTitle("Tissue Enrichment Analysis");
        this.primaryStage.setScene(this.primaryScene);
        this.primaryStage.show();

        //set first content node
        changeContentPane("TeaInputWindow.fxml");

    }


    public static void main(String[] args) {
        launch(args);
    }

    private void changeContentPane(String fxmlFile) throws Exception{
        /*
        Changes node on changingPane.
         */
        Parent contentNode = FXMLLoader.load(getClass().getResource(fxmlFile));
        this.wrappingNode = FXMLLoader.load(getClass().getResource("MainWindow.fxml"));
        Scene newScene = new Scene(wrappingNode);
        ((FlowPane) newScene.lookup("#ContentPane")).getChildren().setAll(contentNode);
        this.primaryStage.setScene(newScene);
    }
}
