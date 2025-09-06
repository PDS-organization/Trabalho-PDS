package com.luccasaps.projetopds.controller.dto;

import com.luccasaps.projetopds.model.Genero;
import jakarta.validation.constraints.*;
import org.hibernate.validator.constraints.UniqueElements;

import java.time.LocalDate;
import java.util.List;

public record UserDTO(
        @NotBlank(message = "campo Obrigatorio")
        @Size(min = 2, max= 100, message = "campo fora do tamanho permitido")
        String name,

        @NotNull(message = "O gênero não pode ser vazio")
        Genero genero,

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
        @Size(min = 8, message = "A senha precisa ter no minimo 8 caracteres")
        String password,

        @NotBlank(message = "campo Obrigatorio")
        String phone,

        @NotBlank
        @Pattern(regexp = "\\d{5}-?\\d{3}", message = "CEP deve estar no formato 00000-000")
        String cep,

        @NotBlank
        @Pattern(
                regexp = "AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO",
                message = "UF inválida"
        )
        String uf,

        @NotBlank @Size(min = 2, max = 120)
        String street,

        @NotEmpty
        @UniqueElements(message = "A lista não pode conter modalidades duplicadas.")
        List<String> modalidadesNomes
        ) {



}
