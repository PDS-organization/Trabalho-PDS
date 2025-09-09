package com.luccasaps.projetopds.controller.dto;

import com.luccasaps.projetopds.model.StatusAtividade;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record AtividadeResponseDTO(
        UUID id,
        String titulo,
        String observacoes,
        LocalDate data,
        LocalTime horario,
        String cep,
        String street,
        StatusAtividade status,
        Integer capacidade,
        boolean semLimite,

        // Dados do criador da atividade
        UUID criadorId,
        String criadorNome,

        // Dados da modalidade (esporte)
        String modalidadeNome,

        // Contagem de participantes
        int participantesCount
) {}