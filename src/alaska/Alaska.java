package alaska;

import alaska.enrichment_analysis.TeaInputWindow;
import alaska.error.Logger;
import alaska.sleuth.SleuthInputWindow;
import javafx.application.Application;
import javafx.application.Platform;
import javafx.concurrent.Task;
import javafx.event.ActionEvent;
import javafx.event.EventHandler;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.CheckBox;
import javafx.scene.control.TextField;
import javafx.stage.Stage;

import javax.swing.*;
import javax.xml.soap.Text;
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
    public static MainWindow alaska = new MainWindow();
    public static ArrayList<ContentWindow> order = new ArrayList<ContentWindow>();

    // Static variables for project title and home directory
    public static String title;
    public static String homeDir;
    public static File home;

    final String KALLISTO_PATH = "";
    final String SLEUTH_PATH = "";
    final String ENRICHMENT_ANALYSIS_PATH = "";

    // Logger
    static Logger logger = new Logger();



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
        order.add(new InfoWindow());
        order.add(new SleuthInputWindow());
        order.add(new TeaInputWindow());

        alaska.start(stage);
        changeContentPane(order.get(0));
    }

    private void changeContentPane(ContentWindow contentWindow) throws Exception {
        /**
         * Manages content & button functions
         */
        // Change content
        alaska.changeContentPane(contentWindow);

        // Create event handler for before button
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
                        title = ((TextField) alaska.lookup("#title_textField")).getText();
                        homeDir = ((TextField) alaska.lookup("#home_textField")).getText();
                        home = new File(homeDir);
                        if(!home.exists()) {
                            home.mkdirs();
                        }

                        // go to sleuth
                        changeContentPane(order.get(1));
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

    private void runEnrichmentAnalysis() {
        /**
         * Runs Enrichment Analysis
         */
        System.out.println("Running enrichment analysis");

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
}
