package alaska;

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
    ArrayList<String> commands = new ArrayList<String>();
    String scriptName;
    String[] args;
    String output_line;
    String output_all;
    String error_line;
    String error_all;
    boolean terminated = false;

    public ScriptExecutor(String scriptName, String[] args) {
        this.scriptName = scriptName;
        this.args = args;
    }

    public void runScript() {
        Thread scriptThread = new Thread(this, scriptName);
        scriptThread.start();
    }

    public void exec() {
        try {
            // ArrayList to store all the arguments of the command
            for (int i = 0; i < this.args.length; i++) {
                commands.add(this.args[i]);
            }

            // Run command in commandline
            ProcessBuilder builder = new ProcessBuilder(commands);
            Process process = builder.start();

            /* Separate streams to capture output (called InputStream for some reason)
            and errors while executing command */
            InputStream inputStream = process.getInputStream();
            InputStream errorStream = process.getErrorStream();

            // Capturing output and error must be buffered, otherwise all lines will be printed after execution.
            BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(inputStream), 1);
            BufferedReader bufferedError = new BufferedReader(new InputStreamReader(errorStream), 1);

            // Print output to standard out
            String line;
            String error;
            while ((line = bufferedReader.readLine()) != null) {
                System.out.println(line);
                this.output_line = line;
                this.output_all += line;
            }
            while ((error = bufferedError.readLine()) != null) {
                System.out.println(error);
                this.error_line = error;
                this.error_all += error;
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

}
