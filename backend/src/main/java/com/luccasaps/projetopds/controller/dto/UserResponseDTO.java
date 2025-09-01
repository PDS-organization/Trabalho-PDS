package com.luccasaps.projetopds.controller.dto;


import java.util.List;
import java.util.UUID;

public record UserResponseDTO(UUID id,
                              String name,
                              String email,
                              String username,
                              String genero,
                              String phone,
                              List<String> modalidades
) {
}
