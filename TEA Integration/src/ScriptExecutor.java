import sun.font.Script;

import java.io.BufferedReader;
import java.io.InputStream;

/**
 * Created by phoen on 4/10/2017.
 */
public abstract class ScriptExecutor implements Runnable {
    String scriptName;
    String scriptPath;
    String[] args;
    BufferedReader outputReader;
    BufferedReader errorReader;

    public ScriptExecutor() {
        this.scriptName = null;
        this.scriptPath = null;
        this.args = null;
    }

    public ScriptExecutor(String path) {
        this.scriptPath = path;
        this.scriptName = path.substring(0, path.lastIndexOf("\\")+1);
        this.args = null;
    }

    public ScriptExecutor(String path, String[] args) {
        this.scriptPath = path;
        this.scriptName = path.substring(0, path.lastIndexOf("\\")+1);
        this.args = args;
    }

    public ScriptExecutor(String scriptName, String scriptPath, String[] args) {
        this.scriptName = scriptName;
        this.scriptPath = scriptPath;
        this.args = args;
    }

    public abstract void exec();

    public void run() {
        exec();
    };

}
