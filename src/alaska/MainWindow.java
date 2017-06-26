package alaska;

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

/**
 * Class handling window operations.
 * Called by Alaska class to open window.
 */
public class MainWindow extends Application {
    Parent wrappingNode;        // node that wraps content + sidebar + navigation buttons
    Stage primaryStage;         // window
    Scene primaryScene;         // scene in that window
    FlowPane content_flowpane;  // content is injected into this flowpane
    Button before_button;       // before button
    Button run_button;          // run button
    Button next_button;         // next button
    Label currentStep;          // sidebar text that indicates current step
    FXMLLoader contentLoader;   // loads FXML content


    /**
     * Called by launch(args) in the main(String[] args) method.
     * Sets the primary stage (primary application window) and sets the initial scene.
     *
     * @param   primaryStage  the window
     * @throws  Exception
     */
    @Override
    public void start(Stage primaryStage) throws Exception{
        // Initiate References
        FXMLLoader loader = new FXMLLoader(getClass().getResource("MainWindow.fxml"));
        wrappingNode = loader.load();
        this.primaryStage = primaryStage;
        content_flowpane = (FlowPane) wrappingNode.lookup("#content_flowpane");
        currentStep = (Label) wrappingNode.lookup("#currentStep_label");
        before_button = (Button) wrappingNode.lookup("#before_button");
        run_button = (Button) wrappingNode.lookup("#run_button");
        next_button = (Button) wrappingNode.lookup("#next_button");
        primaryScene = new Scene(wrappingNode);

        this.primaryStage.setTitle("Alaska");
        this.primaryStage.setScene(primaryScene);
        this.primaryStage.centerOnScreen();
        this.primaryStage.show();
    }

    /**
     * Launches window
     * @param   args
     */
    public static void launch(String[] args) {
        launch(args);
    }


    /**
     * Changes what is shown on the content pane.
     * Dynamically resizes window to accomodate new content.
     * Changes labels on buttons to match properties specified.
     *
     * @param   contentWindow
     * @throws  Exception
     */
    public void changeContentPane(ContentWindow contentWindow) throws Exception {
        // Set new window size & change button text & change label text
        this.primaryStage.setHeight(contentWindow.HEIGHT);
        this.primaryStage.setWidth((contentWindow.WIDTH));
        setElements(contentWindow);

        // Set new content
        ((FlowPane) this.primaryScene.lookup("#content_flowpane"))
                .getChildren().setAll(contentWindow.getContentNode());

        this.contentLoader = contentWindow.contentLoader;
        this.primaryStage.centerOnScreen();
    }

    /**
     * Changes labels on before and next buttons.
     * Changes current step text on sidebar.
     * @param   contentWindow
     */
    public void setElements(ContentWindow contentWindow) {
        // Set visibility
        this.before_button.setVisible(contentWindow.BEFORE_BUTTON_VISIBLE);
        this.run_button.setVisible(contentWindow.NEXT_BUTTON_VISIBLE);

        // Set text
        this.before_button.setText(contentWindow.BEFORE_BUTTON_TEXT);
        this.run_button.setText(contentWindow.NEXT_BUTTON_TEXT);
        this.currentStep.setText(contentWindow.LABEL_TEXT);
    }

    /**
     * Function to lookup certain element in the window with a selector string.
     * @param   selector    (string) selector string
     * @return  Node        that matches the given selector string
     */
    public Node lookup(String selector) {
        return this.primaryScene.lookup(selector);
    }
}
