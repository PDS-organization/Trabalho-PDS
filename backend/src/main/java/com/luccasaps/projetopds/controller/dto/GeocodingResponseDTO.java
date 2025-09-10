package com.luccasaps.projetopds.controller.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

// DTO para mapear a resposta da Brasil API (só precisamos das coordenadas)
@JsonIgnoreProperties(ignoreUnknown = true) // Ignora outros campos do JSON
public record GeocodingResponseDTO(Location location) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Location(String type, Coordinates coordinates) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Coordinates(Double longitude, Double latitude) {}
}