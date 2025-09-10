package com.luccasaps.projetopds.controller.dto;

import java.util.List;

public record PageResponseDTO<T>(List<T> content,         // A lista de itens da página atual
                                 int currentPage,         // O número da página atual (começando em 0)
                                 long totalElements,      // O número total de elementos em todas as páginas
                                 int totalPages  ) {
}
