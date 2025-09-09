package com.luccasaps.projetopds.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record OpenCageResponseDTO(@JsonProperty("results") List<Result> results) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Result(@JsonProperty("geometry") Geometry geometry) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Geometry(@JsonProperty("lat") Double latitude, @JsonProperty("lng") Double longitude) {}
}