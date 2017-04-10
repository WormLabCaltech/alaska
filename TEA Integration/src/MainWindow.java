/**
 * Created by lioscro on 4/7/17.
 */

import com.sun.javafx.fxml.builder.JavaFXSceneBuilder;
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

    public void changeContentPane(String fxmlFile) throws Exception{
        /*
        Changes node on changingPane.
         */
        Parent wrappingNode = FXMLLoader.load(getClass().getResource("MainWindow.fxml"));
        Parent contentNode = FXMLLoader.load(getClass().getResource(fxmlFile));

        //Inject content to FlowPane
        ((FlowPane) wrappingNode.lookup("#ContentPane")).getChildren().setAll(contentNode);

        //Temporary Stage to calculate required window height & width
        Stage tempStage = new Stage();
        tempStage.setScene(new Scene(wrappingNode));
        //Should not be seen by user
        tempStage.setOpacity(0);
        tempStage.show();

        double tempHeight = tempStage.getHeight();
        double tempWidth = tempStage.getWidth();

        tempStage.close();

        //Set appropriate window size and inject content to FlowPane
        this.primaryStage.setHeight(tempHeight);
        this.primaryStage.setWidth(tempWidth);
        this.contentPane.getChildren().setAll(contentNode);

    }
}
