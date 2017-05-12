package alaska;

import javafx.concurrent.Task;
import sun.font.Script;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;

/**
 * Created by phoen on 4/10/2017.
 */
public class ScriptExecutor implements Runnable {
    /**
     * Abstract class that is inherited by all classes for executing scripts.
     * All classes inheriting ScriptExecutor must be run as an independent Thread.
     */
    String scriptName;
    ArrayList<String> args;
    String output_line;
    String output_all;

    Process process;
    Thread scriptThread;
    boolean terminated = false;

    public ScriptExecutor(String scriptName, ArrayList<String> args) {
        this.scriptName = scriptName;
        this.args = args;
    }

    public void runScript() {
        scriptThread = new Thread(this, scriptName);
        scriptThread.setDaemon(true);
        scriptThread.start();
    }

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
        terminated = true;
    }

    public void run() {
        exec();
    };

    public String getOutput() {
        if(output_line == null) {
            return "";
        }
        return output_line;
    }

}
