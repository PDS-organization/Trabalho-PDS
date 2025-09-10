package com.luccasaps.projetopds.controller.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.time.LocalTime;


public record AtividadeCreateDTO(

        @NotBlank(message = "campo Obrigatorio")
        @Size(min = 2, max = 50, message = "campo fora do tamanho permitido")
        String titulo,

        @Size(max = 500)
        String observacoes,

        @NotBlank(message = "campo Obrigatorio")
        @FutureOrPresent(message = "nao pode ser uma data passada")
        LocalDate data,

        @NotBlank(message = "campo Obrigatorio")
        LocalTime horario,

        @NotBlank(message = "campo Obrigatorio")
        @Pattern(regexp = "\\d{5}-?\\d{3}", message = "CEP deve estar no formato 00000-000")
        String cep,

        @NotBlank
        @Pattern(
                regexp = "AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO",
                message = "UF inválida"
        )
        String uf,

        @NotBlank
        @Size(min = 2, max = 120)
        String street,

        @NotNull(message = "campo Obrigatorio")
        Integer capacidade,

        @NotBlank(message = "campo Obrigatorio")
        String modalidade,

        @NotNull(message = "campo Obrigatorio")
        boolean semLimite
) {}