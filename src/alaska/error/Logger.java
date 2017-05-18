package alaska.error;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Created by phoen on 5/16/2017.
 */
public class Logger {
    /**
     * Class that handles event logging
     * ONLY TO BE CALLED BY Alaska CLASS AS STATIC OBJECT
     */
    private File log;
    private String logPath;
    private final LocalDateTime START_TIME = LocalDateTime.now();
    private final String DATE_FORMAT = "yyyy-MM-dd-HH-mm";


    public Logger() {
        logPath = "log-" + formatDate(START_TIME, DATE_FORMAT) + ".log";
        log = new File(logPath);
        try {
            log.createNewFile();
        } catch (IOException e) {
            new AlaskaException("Unable to create log file.");
        }
    }

    public void write(String message) {
        //log.wr
    }

    private String getCurrentTime() {
        LocalDateTime currentTime = LocalDateTime.now();
        return formatDate(currentTime, DATE_FORMAT);
    }

    private String formatDate(LocalDateTime localDateTime, String format) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(format);
        return localDateTime.format(formatter);
    }
}
