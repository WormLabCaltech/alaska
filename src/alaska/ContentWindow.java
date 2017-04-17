package alaska;

import javafx.application.Application;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.layout.FlowPane;
import javafx.stage.Stage;

/**
 * Created by phoen on 4/16/2017.
 */
public class ContentWindow {
    /**
     *  Abstract class to deal with retrieving required width & height when content changes in the Main Window.
     *  IMPORTANT: DO NOT CALL .fxml FILES DIRECTLY WITHOUT USING CHILDREN OF THIS CLASS
     */

    protected boolean BEFORE_BUTTON_VISIBLE;
    protected boolean NEXT_BUTTON_VISIBLE;
    protected String BEFORE_BUTTON_TEXT;
    protected String NEXT_BUTTON_TEXT;
    protected String LABEL_TEXT;
    protected String WRAPPER_PATH;
    protected String FXML_PATH;
    protected double HEIGHT;
    protected double WIDTH;


    public void start() throws Exception {
        /**
         * Called by launch(args) in constructor.
         * Sets the primary stage (primary application window) and sets the initial scene.
         */

        Stage primaryStage = new Stage();
        Parent wrappingNode = FXMLLoader.load(getClass().getResource(WRAPPER_PATH));
        Parent contentNode = FXMLLoader.load(getClass().getResource(FXML_PATH));

        // Inject content
        ((FlowPane) wrappingNode.lookup("#content_flowpane")).getChildren().setAll(contentNode);

        primaryStage.setScene(new Scene(wrappingNode));
        primaryStage.setOpacity(0);
        primaryStage.show();

        HEIGHT = primaryStage.getHeight();
        WIDTH = primaryStage.getWidth();

        primaryStage.close();
    }

    public Parent getContentNode() throws Exception {
        return FXMLLoader.load(getClass().getResource((FXML_PATH)));
    }
}
