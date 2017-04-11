import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

/**
 * Created by phoen on 4/10/2017.
 */
public class PythonScriptExecutor extends ScriptExecutor {

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
            ArrayList<String> commands = new ArrayList<String>();
            commands.add("python");
            commands.add(this.scriptPath);
            commands.add(this.scriptPath);
            for(int i = 0; i < this.args.length; i++) {
                commands.add(this.args[i]);
            }
            ProcessBuilder builder = new ProcessBuilder(commands);
            Process process = builder.start();
            InputStream inputStream = process.getInputStream();
            BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(inputStream),1);
            String line;
            while ((line = bufferedReader.readLine()) != null) {
                System.out.println(line);
            }
            inputStream.close();
            bufferedReader.close();
        }  catch (Exception e) {
            e.printStackTrace();
        }

    }
}
