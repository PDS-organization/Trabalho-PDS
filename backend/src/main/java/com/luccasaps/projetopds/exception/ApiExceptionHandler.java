package com.luccasaps.projetopds.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleRSE(ResponseStatusException ex) {
        Map<String, Object> body = new HashMap<>();
        String reason = ex.getReason(); // exemplo: "EMAIL_TAKEN"

        if (reason != null && reason.equalsIgnoreCase("EMAIL_TAKEN")) {
            body.put("code", "EMAIL_TAKEN");
            body.put("message", "E-mail já cadastrado");
        } else if (reason != null && reason.equalsIgnoreCase("USERNAME_TAKEN")) {
            body.put("code", "USERNAME_TAKEN");
            body.put("message", "Este username já está em uso");
        } else if (reason != null && reason.equalsIgnoreCase("MODALIDADE_INVALIDA")) {
            body.put("code", "MODALIDADE_INVALIDA");
            body.put("message", "Uma ou mais modalidades não existem.");
        } else {
            body.put("message", reason != null ? reason : "Erro");
        }

        return ResponseEntity.status(ex.getStatusCode()).body(body);
    }
}
