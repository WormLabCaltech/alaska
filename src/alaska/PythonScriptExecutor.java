package alaska;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;

/**
 * Created by phoen on 4/10/2017.
 */
public class PythonScriptExecutor extends ScriptExecutor {
    /**
     * ScriptExecutor for Python scripts.
     * Must be run as a thread.
     */

    public PythonScriptExecutor() {
        super();
    }

    public PythonScriptExecutor(String path) {
        super(path);
    }

    public PythonScriptExecutor(String path, String[] args) {
        super(path, args);
    }

    public PythonScriptExecutor(String scriptName, String scriptPath, String[] args) {
        super(scriptName, scriptPath, args);
    }

    @Override
    public void exec() {
        try {
            // ArrayList to store all the arguments of the command
            ArrayList<String> commands = new ArrayList<String>();
            commands.add("python");
            commands.add(this.scriptPath);
            for(int i = 0; i < this.args.length; i++) {
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
            BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(inputStream),1);
            BufferedReader bufferedError = new BufferedReader(new InputStreamReader(errorStream),1);

            // Print output to standard out
            String line;
            String error;
            while ((line = bufferedReader.readLine()) != null) {
                System.out.println(line);
            }
            while ((error = bufferedError.readLine()) != null) {
                System.out.println(error);
            }

            inputStream.close();
            bufferedReader.close();
        }  catch (Exception e) {
            e.printStackTrace();
        }

    }
}
