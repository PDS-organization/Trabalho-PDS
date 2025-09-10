package com.luccasaps.projetopds.controller.dto;

import org.springframework.http.HttpStatus;
import java.time.LocalDateTime;

public record ErrorResponseDTO(
        LocalDateTime timestamp, // A hora em que o erro ocorreu
        int status,              // O código de status HTTP (ex: 404)
        String error,            // O nome do status (ex: "Not Found")
        String message           // A mensagem de erro específica
) {
}