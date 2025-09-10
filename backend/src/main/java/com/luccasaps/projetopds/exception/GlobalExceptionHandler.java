package com.luccasaps.projetopds.exception;
import com.luccasaps.projetopds.controller.dto.ErrorResponseDTO;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Este método irá capturar exceções do tipo EntityNotFoundException
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponseDTO> handleEntityNotFound(EntityNotFoundException ex) {
        HttpStatus status = HttpStatus.NOT_FOUND; // 404
        ErrorResponseDTO errorResponse = new ErrorResponseDTO(
                LocalDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                ex.getMessage()
        );
        return new ResponseEntity<>(errorResponse, status);
    }

    // Captura erros de acesso negado (ex: tentar alterar/deletar algo de outro usuário)
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponseDTO> handleAccessDenied(AccessDeniedException ex) {
        HttpStatus status = HttpStatus.FORBIDDEN; // 403
        ErrorResponseDTO errorResponse = new ErrorResponseDTO(
                LocalDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                "Acesso negado. Você não tem permissão para realizar esta ação."
        );
        return new ResponseEntity<>(errorResponse, status);
    }

    // Captura erros de validação dos DTOs (@Valid)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponseDTO> handleValidationExceptions(MethodArgumentNotValidException ex) {
        HttpStatus status = HttpStatus.BAD_REQUEST; // 400
        // Pega a primeira mensagem de erro de validação para ser mais amigável
        String errorMessage = ex.getBindingResult().getAllErrors().getFirst().getDefaultMessage();
        ErrorResponseDTO errorResponse = new ErrorResponseDTO(
                LocalDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                errorMessage
        );
        return new ResponseEntity<>(errorResponse, status);
    }

    // Captura exceções de lógica de negócio que indicam um estado ilegal
    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<ErrorResponseDTO> handleBusinessLogicExceptions(RuntimeException ex) {
        HttpStatus status = HttpStatus.BAD_REQUEST; // 400
        ErrorResponseDTO errorResponse = new ErrorResponseDTO(
                LocalDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                ex.getMessage()
        );
        return new ResponseEntity<>(errorResponse, status);
    }

    // Um "catch-all" para qualquer outra exceção não tratada
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponseDTO> handleGenericException(Exception ex) {
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR; // 500
        ErrorResponseDTO errorResponse = new ErrorResponseDTO(
                LocalDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                "Ocorreu um erro inesperado no servidor."
        );
        ex.printStackTrace();
        return new ResponseEntity<>(errorResponse, status);
    }
}