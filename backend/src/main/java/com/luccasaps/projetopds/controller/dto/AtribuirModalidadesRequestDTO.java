package com.luccasaps.projetopds.controller.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record AtribuirModalidadesRequestDTO(
        List<String> modalidadesNomes
) {}