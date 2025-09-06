package com.luccasaps.projetopds.controller.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.UniqueElements;

import java.time.LocalDate;
import java.util.List;

// Usamos record para um DTO. Os campos são os que permitimos que sejam alterados.
public record UserUpdateDTO(
        @Size(min = 2, max = 100, message = "Nome fora do tamanho permitido")
        String name,

        @Size(max = 50, min = 2, message = "Username fora do tamanho permitido")
        String username,

        @Email
        String email,

        @Past(message = "Não pode ser uma data futura")
        LocalDate dataNascimento,

        @Size(min = 8, message = "A senha deve ter no mínimo 8 caracteres")
        String password,

        String phone,

        @UniqueElements
        List<String> modalidadesNomes
) {
}