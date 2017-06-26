package alaska;

import javafx.concurrent.Task;
import sun.font.Script;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;

/**
 * Class to execute third-party (python, R) scripts.
 */
public class ScriptExecutor implements Runnable {
    String scriptName;          // script name
    ArrayList<String> args;     // command line arguments
    String output_line;         // most recent script output
    String output_all;          // total script output

    Process process;            // script execution process
    Thread scriptThread;        // script execution thread
    boolean terminated = false; // whether the script has finished

    /**
     * Constructor.
     * Saves argument variables.
     *
     * @param   scriptName  (String) script name
     * @param   args        (ArrayList<String>) command line arguments
     */
    public ScriptExecutor(String scriptName, ArrayList<String> args) {
        /* begin initializing references */
        this.scriptName = scriptName;
        this.args = args;
        /* end initializing references */
    }

    /**
     * Executes the script using the provided arguments (from the constructor).
     * THIS IS THE FUNCTION TO USE TO RUN THE SCRIPT
     */
    public void runScript() {
        scriptThread = new Thread(this, scriptName);
        scriptThread.setDaemon(true);
        scriptThread.start();
    }

    /**
     * Called by run() to execute script.
     * DO NOT USE THIS FUNCTION. USE runScript().
     */
    public void exec() {
        try {
            // Run command in commandline
            ProcessBuilder builder = new ProcessBuilder(args);
            builder.redirectErrorStream(true); // Redirects error stream to standard input stream
            process = builder.start();

            /* Separate streams to capture output (called InputStream for some reason)
            and errors while executing command */
            InputStream inputStream = process.getInputStream();

            // Capturing output and error must be buffered, otherwise all lines will be printed after execution.
            BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(inputStream), 1);

            // Print output to standard out
            String line;
            String prev_line = "";
            while((line = bufferedReader.readLine()) != null) {
                if(!line.equals(prev_line)) {
                    output_all += line;
                    output_line = line;
                    prev_line = line;
                    System.out.println(output_line);
                }
            }

            inputStream.close();
            bufferedReader.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
        terminated = true;  // script is finished
    }

    /**
     * Automatically called when thread is started.
     * DO NOT USE THIS FUNCTION. USE runScript().
     */
    public void run() {
        exec();
    };

    /**
     * Returns the most recent output.
     * @return  String  output text
     *
     * TODO: depreciated?
     */
    public String getOutput() {
        if(output_line == null) {
            return "";
        }
        return output_line;
    }

}
