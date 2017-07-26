package alaska;

import alaska.enrichment_analysis.TeaInputWindow;
import alaska.error.Logger;
import alaska.sleuth.SleuthInputWindow;
import javafx.application.Application;
import javafx.application.Platform;
import javafx.concurrent.Task;
import javafx.event.ActionEvent;
import javafx.event.EventHandler;
import javafx.scene.Node;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.CheckBox;
import javafx.scene.control.TextField;
import javafx.scene.control.Tooltip;
import javafx.stage.Stage;

import javax.swing.*;
import javax.xml.soap.Text;
import java.awt.*;
import java.io.File;
import java.net.URI;
import java.util.ArrayList;

/**
 * Alaska main class.
 * Contains main(String[] args) to run the program.
 *
 *
 * TODO: handle exceptions with AlaskaException
 * TODO: logger functionality
 * TODO: directory structure
 * TODO: better way to pre-populate fields
 * TODO: better input validation
 *
 * TODO: kallisto
 * TODO: design matrix
 */
public class Alaska extends Application {
    public static MainWindow alaska = new MainWindow(); // Alaska window
    public static ArrayList<ContentWindow> order = new ArrayList<>(); // order of windows

    // Static variables for project title and home directory
    public static String title;
    public static String homeDir;
    public static File home;

    // TODO: define script paths here
    final String KALLISTO_PATH = "";
    final String SLEUTH_PATH = "";
    final String ENRICHMENT_ANALYSIS_PATH = "";

    // TODO: add logger functionallity. 6/26: only creates log file without any output
    static Logger logger = new Logger();



    /**
     * Launches Alaska with args
     *
     * @param   args
     * @return  none
     */
    public static void main(String[] args) {
        launch(args);
    }

    /**
     * Function called by launch(args) in main() to start the application.
     *
     * @param   stage   JavaFX stage corresponding to Alaska window
     * @throws  Exception
     * @return  none
     */
    public void start(Stage stage) throws Exception {
        // add windows in order
        // TODO: is there a cleaner way to do this?
        order.add(new InfoWindow());
        order.add(new SleuthInputWindow());
        order.add(new TeaInputWindow());

        alaska.start(stage);
        changeContentPane(order.get(0)); // set content to see right after opening application
    }

    /**
     * Changes the content displayed in the window.
     * Used to switch between displays.
     *
     * @param   contentWindow   (ContentWindow) to show
     * @throws  Exception
     * @return  none
     */
    private void changeContentPane(ContentWindow contentWindow) throws Exception {
        // Change content
        alaska.changeContentPane(contentWindow);

        // Create event handler for before button
        // TODO: simplify button handlers
        EventHandler<ActionEvent> beforeButtonHandler = new EventHandler<ActionEvent>() {
            @Override
            public void handle(ActionEvent event) {
                /* Handle changing content panel */
                String currentStep = alaska.currentStep.getText();
                if(currentStep.contains("Enrichment")) {
                    try{
                        // go to sleuth
                        changeContentPane(order.get(1));
                    } catch(Exception e) {
                        e.printStackTrace();
                    }
                }else if(currentStep.contains("Sleuth")) {
                    try{
                        // go to project information
                        changeContentPane(order.get(0));
                    } catch(Exception e) {
                        e.printStackTrace();
                    }
                }
            }
        };

        // Create event handler for run button
        EventHandler<ActionEvent> runButtonHandler = new EventHandler<ActionEvent>() {
            @Override
            public void handle(ActionEvent event) {
                // Handle changing content panel
                String currentStep = alaska.currentStep.getText();
                if(currentStep.contains("Enrichment")) {
                    runEnrichmentAnalysis();
                }else if(currentStep.contains("Sleuth")) {
                    try {
                        runSleuth();
                    } catch(Exception e) {
                        e.printStackTrace();
                    }

                }
            }
        };

        // Create event handler for next button
        EventHandler<ActionEvent> nextButtonHandler = new EventHandler<ActionEvent>() {
            @Override
            public void handle(ActionEvent actionEvent) {
                String currentStep = alaska.currentStep.getText();
                if(currentStep.contains("Info")) {
                    try {
                        // Static variables for project title and home directory
                        TextField title_textField = ((TextField) alaska.lookup("#title_textField"));
                        TextField homeDir_textField = ((TextField) alaska.lookup("#home_textField"));

                        if(title_textField.getText().equals("")) {
                            Tooltip title_error = new Tooltip("Please input a valid project title!");
                            title_textField.setTooltip(title_error);
                        }else if(homeDir_textField.getText().equals("")) {
                            Tooltip homeDir_error = new Tooltip("Please select a valid home directory!");

                        }else {
                            home = new File(homeDir);
                            if(!home.exists()) {
                                home.mkdirs();
                            }
                            // go to sleuth
                            changeContentPane(order.get(1));
                        }


                    } catch(Exception e) {
                        e.printStackTrace();
                    }
                }else if(currentStep.contains("Sleuth")) {
                    try {
                        // go to enrichment analysis
                        changeContentPane(order.get(2));
                    } catch(Exception e) {
                        e.printStackTrace();
                    }
                }else if(currentStep.contains("Enrichment")) {
                    // Do something
                }
            }
        };

        // Bind event handlers to each button
        alaska.before_button.setOnAction(beforeButtonHandler);
        alaska.run_button.setOnAction(runButtonHandler);
        alaska.next_button.setOnAction(nextButtonHandler);

    }

    /**
     * Runs Sleuth.
     *
     * @throws  Exception
     *
     */
    private void runSleuth() throws Exception {
        // Open popup to ask whether Shiny server should be started
        PopupWindow shinyPopup = new PopupWindow("Shiny?", "Would you like to open a shiny web server?",
                true, true, "Yes", "No");


        /* Start Sleuth Arguments ArrayList */
        ArrayList<String> args = new ArrayList<>();
        args.add("Rscript");
        args.add("src/alaska/sleuth/diff_exp_analyzer.R");
        args.add("-d");
        args.add("src/alaska/sleuth/kallisto");
        args.add("-o");
        args.add("src/alaska/sleuth/kallisto/sleuth_output");
        /* End Sleuth Arguments ArrayList */


        // Event Handlers for yes and no buttons on popup
        EventHandler<ActionEvent> yes = new EventHandler<ActionEvent>() {
            @Override
            public void handle(ActionEvent event) {
                args.add("-s"); // Add shiny option argument to Sleuth arguments
                shinyPopup.popupStage.close();
                ScriptExecutor sleuth = new ScriptExecutor("Sleuth", args);
                ProgressWindow progressWindow = new ProgressWindow(sleuth, "Running Sleuth...");
                progressWindow.output_label.setText("Starting Sleuth");
            }
        };
        EventHandler<ActionEvent> no = new EventHandler<ActionEvent>() {
            @Override
            public void handle(ActionEvent event) {
                shinyPopup.popupStage.close();
                ScriptExecutor sleuth = new ScriptExecutor("Sleuth", args);
                ProgressWindow progressWindow = new ProgressWindow(sleuth, "Running Sleuth...");
                progressWindow.output_label.setText("Starting Sleuth");
            }
        };
        // Assign Event Handlers
        shinyPopup.left_button.setOnAction(yes);
        shinyPopup.right_button.setOnAction(no);
    }


    /**
     * Runs tissue, phenotype, and GO enrichment analyses.
     */
    private void runEnrichmentAnalysis() {
        System.out.println("Running enrichment analysis");

        // Get important information from inputs
        // TODO: is there a better way to do this?
        String geneListPath = ((TextField) alaska.lookup("#geneList_textField")).getText();
        String title = ((TextField) alaska.lookup("#title_textField")).getText();
        String outputPath = ((TextField) alaska.lookup("#output_textField")).getText();

        // Create specified output directories if they do not exist
        File teaOutput = new File(outputPath + "/TEA/");
        File peaOutput = new File(outputPath + "/PEA/");
        File goOutput = new File(outputPath + "/GO/");
        if(!teaOutput.exists()) {
            try {
                teaOutput.mkdirs();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        if(!peaOutput.exists()) {
            try {
                peaOutput.mkdirs();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        if(!goOutput.exists()) {
            try {
                goOutput.mkdirs();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        // Enrichment analysis arguments
        ArrayList<String> teaArgs = new ArrayList<String>();
        ArrayList<String> peaArgs = new ArrayList<String>();
        ArrayList<String> goArgs = new ArrayList<String>();

        teaArgs.add("python");
        teaArgs.add("src/alaska/enrichment_analysis/hypergeometricTests.py");
        teaArgs.add(geneListPath);
        teaArgs.add(teaOutput.getPath() + "/" + title + "_tea");
        teaArgs.add("tissue");

        peaArgs.add("python");
        peaArgs.add("src/alaska/enrichment_analysis/hypergeometricTests.py");
        peaArgs.add(geneListPath);
        peaArgs.add(peaOutput.getPath() + "/" + title + "_pea");
        peaArgs.add("phenotype");

        goArgs.add("python");
        goArgs.add("src/alaska/enrichment_analysis/hypergeometricTests.py");
        goArgs.add(geneListPath);
        goArgs.add(goOutput.getPath() + "/" + title + "_go");
        goArgs.add("go");

        // if Q-value
        if(((CheckBox) alaska.lookup("#qValue_checkBox")).isSelected()) {
            String qValue = ((TextField) alaska.lookup("#qValue_textField")).getText();

            teaArgs.add("-q");
            teaArgs.add(qValue);

            peaArgs.add("-q");
            peaArgs.add(qValue);

            goArgs.add("-q");
            goArgs.add(qValue);
        }

        // if save graph
        if(((CheckBox) alaska.lookup("#saveGraph_checkBox")).isSelected()) {
            teaArgs.add("-s");
            peaArgs.add("-s");
            goArgs.add("-s");
        }

        ScriptExecutor tea = new ScriptExecutor("Tea", teaArgs);
        ScriptExecutor pea = new ScriptExecutor("Pea", peaArgs);
        ScriptExecutor go = new ScriptExecutor("Go", goArgs);

        tea.runScript();
        pea.runScript();

        ProgressWindow enrichmentProgress = new ProgressWindow(go, "Running enrichment analyses...");
        enrichmentProgress.setOutputText("This won't take long.");
    }

    /**
     * Shows tooltip at a given location with delay.
     * TODO: work in progress...
     *
     * @param content
     * @param delay
     * @param show
     * @param X
     * @param Y
     */
    public void showToolTip(String content, int delay, int show, double X, double Y) {

    }
}