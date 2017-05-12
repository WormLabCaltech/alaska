package alaska;

import alaska.enrichment_analysis.TeaInputWindow;
import alaska.sleuth.SleuthInputWindow;
import javafx.application.Application;
import javafx.application.Platform;
import javafx.concurrent.Task;
import javafx.event.ActionEvent;
import javafx.event.EventHandler;
import javafx.scene.control.TextField;
import javafx.stage.Stage;

import javax.swing.*;
import java.awt.*;
import java.io.File;
import java.net.URI;
import java.util.ArrayList;

/**
 * Created by phoen on 4/20/2017.
 */
public class Alaska extends Application {
    /**
     * Main Wrapper class for all windows & functionality of Alaska
     */
    // Alaska window
    static MainWindow alaska = new MainWindow();
    static String workingDir = new File("").getAbsolutePath();

    final String KALLISTO_PATH = "";
    final String SLEUTH_PATH = "";
    final String ENRICHMENT_ANALYSIS_PATH = "";



    public static void main(String[] args) {
        /**
         * Launches application
         */
        launch(args);
    }

    public void start(Stage stage) throws Exception {
        /**
         * Called by launch(args) in main().
         */
        alaska.start(stage);

        // Create event handler for before button
        EventHandler<ActionEvent> beforeButtonHandler = new EventHandler<ActionEvent>() {
            @Override
            public void handle(ActionEvent event) {
                /* Handle changing content panel */
            }
        };

        // Create event handler for next button
        EventHandler<ActionEvent> nextButtonHandler = new EventHandler<ActionEvent>() {
            @Override
            public void handle(ActionEvent event) {
                // Handle changing content panel
                if(alaska.currentStep.getText().contains("Enrichment")) {
                    runEnrichmentAnalysis();
                }else if(alaska.currentStep.getText().contains("Sleuth")) {
                    try {
                        runSleuth();
                    } catch(Exception e) {
                        e.printStackTrace();
                    }

                }
            }
        };

        // Bind event handlers to each button
        alaska.before_button.setOnAction(beforeButtonHandler);
        alaska.next_button.setOnAction(nextButtonHandler);

        alaska.changeContentPane(new TeaInputWindow());

    }

    private void scriptPopup(String title, String text, boolean left_visible, boolean right_visible, String left_text, String right_text) throws Exception {
        /**
         * Method to open a new popup window for running scripts.
         * TODO: WORK IN PROGRESS
         */

        PopupWindow popupWindow = new PopupWindow(title, text, left_visible, right_visible, left_text, right_text);



    }

    private void runSleuth() throws Exception {
        /**
         * Runs Sleuth
         * Uses JRI library to run R script in a separate thread
         * TODO: DOESN'T WORK, CHANGE BACK TO SCRIPTEXECUTOR
         */
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
                ProgressWindow progressWindow = new ProgressWindow(sleuth);
                progressWindow.output_label.setText("Starting Sleuth");
            }
        };
        EventHandler<ActionEvent> no = new EventHandler<ActionEvent>() {
            @Override
            public void handle(ActionEvent event) {
                shinyPopup.popupStage.close();
                ScriptExecutor sleuth = new ScriptExecutor("Sleuth", args);
                ProgressWindow progressWindow = new ProgressWindow(sleuth);
                progressWindow.output_label.setText("Starting Sleuth");
            }
        };
        // Assign Event Handlers
        shinyPopup.left_button.setOnAction(yes);
        shinyPopup.right_button.setOnAction(no);
    }

    private void runEnrichmentAnalysis() {
        /**
         * Runs Enrichment Analysis
         */

        // Get important information from nodes
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

        // Run TEA in new thread
        ArrayList<String> teaArgs = new ArrayList<String>();
        ArrayList<String> peaArgs = new ArrayList<String>();
        ArrayList<String> goArgs = new ArrayList<String>();

        teaArgs.add("python");
        teaArgs.add("src/alaska/enrichment_analysis/hypergeometricTests.py");
        teaArgs.add(geneListPath);
        teaArgs.add(teaOutput.getPath());
        teaArgs.add("tissue");
        teaArgs.add("-s");

        peaArgs.add("python");
        peaArgs.add("src/alaska/enrichment_analysis/hypergeometricTests.py");
        peaArgs.add(geneListPath);
        peaArgs.add(peaOutput.getPath());
        peaArgs.add("phenotype");
        peaArgs.add("-s");

        goArgs.add("python");
        goArgs.add("src/alaska/enrichment_analysis/hypergeometricTests.py");
        goArgs.add(geneListPath);
        goArgs.add(teaOutput.getPath() + "result");
        goArgs.add("go");
        goArgs.add("-s");

        ScriptExecutor tea = new ScriptExecutor("Tea", teaArgs);
        ScriptExecutor pea = new ScriptExecutor("Pea", peaArgs);
        ScriptExecutor go = new ScriptExecutor("Go", goArgs);

        tea.runScript();
        pea.runScript();
        go.runScript();
    }
}
