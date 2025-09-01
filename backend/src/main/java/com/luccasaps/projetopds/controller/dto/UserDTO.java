package com.luccasaps.projetopds.controller.dto;

import jakarta.validation.constraints.*;
import org.hibernate.validator.constraints.UniqueElements;

import java.time.LocalDate;
import java.util.List;

public record UserDTO(
        @NotBlank(message = "campo Obrigatorio")
        @Size(min = 2, max= 100, message = "campo fora do tamanho permitido")
        String name,

        @NotBlank(message = "O gênero não pode ser vazio")
        String genero,

        @NotBlank(message = "campo Obrigatorio")
        @Size(max= 50, min = 2, message = "campo fora do tamanho permitido")
        String username,

        @NotBlank(message = "campo Obrigatorio")
        @Email
        String email,

        @NotNull(message = "campo Obrigatorio")
        @Past(message = "nao pode ser uma data futura")
        LocalDate dataNascimento,

        @NotBlank(message = "campo Obrigatorio")
        String password,

        @NotBlank(message = "campo Obrigatorio")
        String phone,

        @UniqueElements(message = "A lista não pode conter modalidades duplicadas.")
        List<String> modalidadesNomes
        ) {



}
