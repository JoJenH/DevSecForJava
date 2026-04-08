package com.devsec.vulverify.config;

import com.devsec.vulverify.model.VerifyResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@ControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<VerifyResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        logger.error("Type mismatch error: {}", ex.getMessage());
        VerifyResponse response = VerifyResponse.error("Invalid parameter: " + ex.getName());
        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<VerifyResponse> handleIllegalArgument(IllegalArgumentException ex) {
        logger.error("Illegal argument error: {}", ex.getMessage());
        VerifyResponse response = VerifyResponse.error(ex.getMessage());
        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<VerifyResponse> handleGeneral(Exception ex) {
        logger.error("Unexpected error: ", ex);
        VerifyResponse response = VerifyResponse.error("Internal server error: " + ex.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
