package alaska.error;

/**
 * Created by phoen on 5/15/2017.
 */
public class AlaskaException extends Exception {
    /**
     * Custom Alaska Exception handler
     */

    public AlaskaException(String message) {
        super(message);
        openErrorWindow(message, -1);
    }

    public AlaskaException(String message, int code) {
        super(message);
        openErrorWindow(message, code);
    }

    public AlaskaException(Throwable cause) {
        super(cause);
    }

    public AlaskaException(String message, Throwable cause) {
        super(message, cause);
    }

    public AlaskaException(String message, Throwable cause, boolean enableSuppression, boolean writableStackTrace) {
        super(message, cause, enableSuppression, writableStackTrace);
    }

    public void openErrorWindow(String message, int code) {
        new ErrorWindow(message, code, this);
    }
}
