package alaska;

import javafx.application.Application;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.layout.FlowPane;
import javafx.stage.Stage;

/**
 * Class to deal with retrieving required width & height when content changes in the Main Window.
 * IMPORTANT: DO NOT CALL .fxml FILES DIRECTLY WITHOUT USING CHILDREN OF THIS CLASS
 */
public class ContentWindow {
    // properties of the window
    protected boolean BEFORE_BUTTON_VISIBLE;
    protected boolean NEXT_BUTTON_VISIBLE;
    protected String BEFORE_BUTTON_TEXT;
    protected String NEXT_BUTTON_TEXT;
    protected String LABEL_TEXT;
    protected String WRAPPER_PATH;
    protected String FXML_PATH;
    protected double HEIGHT;
    protected double WIDTH;

    FXMLLoader wrapperLoader;
    FXMLLoader contentLoader;
    Parent contentNode;
    boolean loaded = false; // keep track if it was loaded before
                            // if it was, doesn't need to be re-initialized


    /**
     * Called by launch(args) in constructor.
     * Sets the primary stage (primary application window) and sets the initial scene.
     *
     * @throws Exception
     */
    public void start() throws Exception {
        // load FXML
        Stage primaryStage = new Stage();
        wrapperLoader = new FXMLLoader(getClass().getResource(WRAPPER_PATH));
        contentLoader = new FXMLLoader(getClass().getResource(FXML_PATH));
        Parent wrappingNode = wrapperLoader.load();
        Parent contentNode = contentLoader.load();

        // Inject content FXML to the content pane of wrapper
        ((FlowPane) wrappingNode.lookup("#content_flowpane")).getChildren().setAll(contentNode);

        // Window must be opened to calculate height and width
        // But this is not what should be shown
        primaryStage.setOpacity(0.0);
        primaryStage.hide();
        primaryStage.setX(99999.9);
        primaryStage.setScene(new Scene(wrappingNode));
        primaryStage.show();

        HEIGHT = primaryStage.getHeight();
        WIDTH = primaryStage.getWidth();

        // close temporary window after height and width has been calculated
        primaryStage.close();
    }

    /**
     * Function to be used to retreive node loaded by content FXML
     *
     * @return Parent
     * @throws Exception
     */
    public Parent getContentNode() throws Exception {
        // initialize only if this is the first time loading
        if(!loaded) {
            contentLoader = new FXMLLoader(getClass().getResource(FXML_PATH));
            contentNode = contentLoader.load();
            loaded = true;
        }
        return contentNode;
    }
}
