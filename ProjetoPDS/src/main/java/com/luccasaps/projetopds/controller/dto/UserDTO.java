package com.luccasaps.projetopds.controller.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDate;

public record UserDTO(
        @NotBlank(message = "campo Obrigatorio")
        @Size(min = 2, max= 100, message = "campo fora do tamanho permitido")
        String name,

        @NotBlank(message = "campo Obrigatorio")
        @Size(max= 50, min = 2, message = "campo fora do tamanho permitido")
        String userName,

        @NotBlank(message = "campo Obrigatorio")
        @Email
        String email,

        @NotNull(message = "campo Obrigatorio")
        @Past(message = "nao pode ser uma data futura")
        LocalDate dataNascimento,

        @NotBlank(message = "campo Obrigatorio")
        String password,

        @NotBlank(message = "campo Obrigatorio")
        String phone


        ) {



}
