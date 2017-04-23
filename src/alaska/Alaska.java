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
import org.rosuda.JRI.Rengine;

import javax.swing.*;
import java.io.File;

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

        alaska.changeContentPane(new SleuthInputWindow());

    }

    private void scriptPopup(ScriptExecutor script, String title, String text, boolean left_visible, boolean right_visible, String left_text, String right_text) throws Exception {
        /**
         * Method to open a new popup window for running scripts.
         * TODO: WORK IN PROGRESS
         */

        PopupWindow popupWindow = new PopupWindow(title, text, left_visible, right_visible, left_text, right_text);

        Task updateTask = new Task<Void>() {
            @Override
            public Void call() throws Exception {
                long startTime = System.nanoTime();
                //script.runScript();
                while(!script.terminated) {
                    Platform.runLater(new Runnable() {
                        @Override
                        public void run() {
                            long elapsedTime = System.nanoTime() - startTime;
                            popupWindow.changeText(Long.toString(elapsedTime));
                        }
                    });
                }
                return null;
            }
        };
        Thread updateThread = new Thread(updateTask);
        updateThread.setDaemon(true);
        updateThread.start();


    }

    private void runSleuth() throws Exception {
        /**
         * Runs Sleuth
         * Uses JRI library to run R script in a separate thread
         * TODO: DOESN'T WORK, CHANGE BACK TO SCRIPTEXECUTOR
         */
        String[] r_args = {"--vanilla"};
        Rengine rengine = new Rengine(r_args, false, null);
        rengine.eval("source(\"/src/alaska/sleuth/cmd_line_diff_exp_analyzer.R\")");
    }

    private void runEnrichmentAnalysis() {
        /**
         * Runs Enrichment Analysis
         */

        // Get important information from nodes
        String geneListPath = ((TextField) alaska.lookup("geneList_textField")).getText();
        String title = ((TextField) alaska.lookup("title_textField")).getText();
        String outputPath = ((TextField) alaska.lookup("output_textField")).getText();

        // Create specified output directories if they do not exist
        File teaOutput = new File(outputPath + "\\TEA\\");
        File peaOutput = new File(outputPath + "\\PEA\\");
        File goOutput = new File(outputPath + "\\GO\\");
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
        String[] teaArgs = {geneListPath, teaOutput.getPath() + "result", "tissue", "-s"};
        String[] peaArgs = {geneListPath, teaOutput.getPath() + "result", "phenotype", "-s"};
        String[] goArgs = {geneListPath, teaOutput.getPath() + "result", "go", "-s"};

        ScriptExecutor tea = new ScriptExecutor(workingDir.replace("\\","/") + "/enrichment_analysis/hypergeometrictest.py", teaArgs);
        ScriptExecutor pea = new ScriptExecutor("/alaska/enrichment_analysis/hypergeometricTests.py", peaArgs);
        ScriptExecutor go = new ScriptExecutor("/alaska/enrichment_analysis/hypergeometricTests.py", goArgs);

        tea.runScript();
        pea.runScript();
        go.runScript();
    }
}
