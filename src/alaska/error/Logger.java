package alaska.error;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Class that handles event logging
 * ONLY TO BE CALLED BY Alaska CLASS AS STATIC OBJECT
 */
public class Logger {
    private File log;                                               // log file
    private String logPath;                                         // log file path
    private final LocalDateTime START_TIME = LocalDateTime.now();   // time Alaska was launched
    private final String DATE_FORMAT = "yyyy-MM-dd-HH-mm";          // date, time format

    /**
     * Constructor.
     * Creates log file.
     */
    public Logger() {
        logPath = "log-" + formatDate(START_TIME, DATE_FORMAT) + ".log";
        log = new File(logPath);
        try {
            log.createNewFile();
        } catch (IOException e) {
            new AlaskaException("Unable to create log file.");
        }
    }

    /**
     * Write message to log.
     * @param   message (String) log output
     *
     * TODO: work in progress...
     */
    public void write(String message) {
        //log.wr
    }

    /**
     * Get current time as string.
     * Used as timestamp for log output.
     *
     * @return  String
     *
     * TODO: work in progress...
     */
    private String getCurrentTime() {
        LocalDateTime currentTime = LocalDateTime.now();
        return formatDate(currentTime, DATE_FORMAT);
    }

    /**
     * Format date, time.
     *
     * @param   localDateTime   (LocalDateTime) current date and time
     * @param   format          (String) how to format
     * @return  String          formatted date and time
     */
    private String formatDate(LocalDateTime localDateTime, String format) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(format);
        return localDateTime.format(formatter);
    }
}
