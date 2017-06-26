package alaska.error;

/**
 * Custom Alaska Exception handler
 */
public class AlaskaException extends Exception {
    /**
     * Constructor.
     * Opens new error window with message.
     * @param   message (String) error message
     */
    public AlaskaException(String message) {
        super(message);
        openErrorWindow(message, -1);
    }

    /**
     * Constructor.
     * Opens new error window with message and code.
     * @param   message (String) error message
     * @param   code    (int) error code
     */
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

    /**
     * Opens error window.
     * @param   message (String) error message
     * @param   code    (int) error code
     */
    public void openErrorWindow(String message, int code) {
        new ErrorWindow(message, code, this);
    }
}
