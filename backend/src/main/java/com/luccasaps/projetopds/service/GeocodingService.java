package com.luccasaps.projetopds.service;

import com.luccasaps.projetopds.controller.dto.GeocodingResponseDTO;
import com.luccasaps.projetopds.dto.OpenCageResponseDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class GeocodingService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${geocoding.opencage.api-key}")
    private String openCageApiKey;

    // Criamos um record simples para retornar as coordenadas de forma padronizada
    public record Coordenadas(Double latitude, Double longitude) {}

    public Coordenadas getCoordinates(String cep) {
        String cepLimpo = cep.replaceAll("[^0-9]", "");
        if (cepLimpo.length() != 8) {
            return null;
        }

        // --- TENTATIVA 1: Brasil API ---
        try {
            String urlBrasilApi = "https://brasilapi.com.br/api/cep/v2/" + cepLimpo;
            GeocodingResponseDTO response = restTemplate.getForObject(urlBrasilApi, GeocodingResponseDTO.class);

            if (response != null && response.location() != null && response.location().coordinates() != null && response.location().coordinates().latitude() != null) {
                System.out.println("LOG DE DEBUG: Coordenadas encontradas via Brasil API.");
                return new Coordenadas(response.location().coordinates().latitude(), response.location().coordinates().longitude());
            }
        } catch (Exception e) {
            System.err.println("LOG DE ERRO: Brasil API falhou. Causa: " + e.getMessage());
        }

        // --- TENTATIVA 2: OpenCage API (Fallback) ---
        System.out.println("LOG DE DEBUG: Fallback para OpenCage API.");
        try {
            // A consulta do OpenCage pode ser mais genérica, usando o CEP e "Brasil"
            String urlOpenCage = String.format("https://api.opencagedata.com/geocode/v1/json?q=%s, Brasil&key=%s", cepLimpo, openCageApiKey);
            OpenCageResponseDTO response = restTemplate.getForObject(urlOpenCage, OpenCageResponseDTO.class);

            if (response != null && response.results() != null && !response.results().isEmpty()) {
                OpenCageResponseDTO.Geometry geometry = response.results().get(0).geometry();
                if (geometry != null && geometry.latitude() != null) {
                    System.out.println("LOG DE DEBUG: Coordenadas encontradas via OpenCage API.");
                    return new Coordenadas(geometry.latitude(), geometry.longitude());
                }
            }
        } catch (Exception e) {
            System.err.println("LOG DE ERRO: OpenCage API (fallback) também falhou. Causa: " + e.getMessage());
        }

        // Se ambas as APIs falharem, retorna nulo
        return null;
    }
}