package com.luccasaps.projetopds.controller.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record AtribuirModalidadesRequestDTO(
        @NotEmpty(message = "A lista de modalidades não pode ser vazia.")
        List<String> modalidadesNomes
) {}