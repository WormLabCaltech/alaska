package alaska; /**
 * Created by lioscro on 4/7/17.
 * Main application window.
 */

import alaska.enrichment_analysis.TeaInputWindow;
import javafx.application.Application;
import javafx.fxml.FXMLLoader;
import javafx.scene.Node;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.layout.*;
import javafx.stage.Stage;

import java.util.ArrayList;

public class MainWindow extends Application {
    /**
     * MainWindow Class: deals with content changing & before and after buttons
     *
     * TODO: add before button functionality
     */

    Parent wrappingNode;
    Stage primaryStage;
    Scene primaryScene;
    FlowPane content_flowpane;
    Button before_button;
    Button next_button;
    Label currentStep;


    @Override
    public void start(Stage primaryStage) throws Exception{
        /**
         * Called by launch(args) in the main(String[] args) method.
         * Sets the primary stage (primary application window) and sets the initial scene.
         */
        // Initiate References
        this.wrappingNode = FXMLLoader.load(getClass().getResource("MainWindow.fxml"));
        this.primaryStage = primaryStage;
        this.content_flowpane = (FlowPane) this.wrappingNode.lookup("#content_flowpane");
        this.currentStep = (Label) this.wrappingNode.lookup("#currentStep_label");
        this.before_button = (Button) this.wrappingNode.lookup("#before_button");
        this.next_button = (Button) this.wrappingNode.lookup("#next_button");
        this.primaryScene = new Scene(this.wrappingNode);

        // Set and

        this.primaryStage.setTitle("Alaska");
        this.primaryStage.setScene(this.primaryScene);
        this.primaryStage.show();


    }

    public static void launch(String[] args) {
        launch(args);
    }

    /*public static void main(String[] args) {
        launch(args);
    }*/

    public void changeContentPane(ContentWindow contentWindow) throws Exception {
        /**
         * Changes what is shown on the content pane.
         * Dynamically resizes window to accomodate new content.
         * Changes labels on buttons to match content.
         */

        // Erase content
        ((FlowPane) this.primaryScene.lookup("#content_flowpane")).getChildren().removeAll();

        // Set new window size & change button text & change label text
        this.primaryStage.setHeight(contentWindow.HEIGHT);
        this.primaryStage.setWidth((contentWindow.WIDTH));
        setElements(contentWindow);

        // Set new content
        ((FlowPane) this.primaryScene.lookup("#content_flowpane"))
                .getChildren().setAll(contentWindow.getContentNode());
    }

    public void setElements(ContentWindow contentWindow) {
        /**
         * Changes labels on before and next buttons.
         */
        // Set visibility
        this.before_button.setVisible(contentWindow.BEFORE_BUTTON_VISIBLE);
        this.next_button.setVisible(contentWindow.NEXT_BUTTON_VISIBLE);

        // Set text
        this.before_button.setText(contentWindow.BEFORE_BUTTON_TEXT);
        this.next_button.setText(contentWindow.NEXT_BUTTON_TEXT);
        this.currentStep.setText(contentWindow.LABEL_TEXT);
    }

    public void beforeBtnHandler() {
        /**
         * PLACEHOLDER
         * Button handler for the button to go back a step.
         * This method can not be placed in the Controller class due to the inability to change content pane
         * from the Controller class.
         */

    }

    public void nextBtnHandler() {
        /**
         * PLACEHOLDER
         * Button handler for the button to proceed a step.
         * This method can not be placed in the Controller class due to the inability to change content pane
         * from the Controller class.
         */

    }

    public Node lookup(String selector) {
        return this.primaryScene.lookup("#" + selector);
    }
}
