package com.luccasaps.projetopds.controller.dto;

import com.luccasaps.projetopds.model.StatusAtividade;
import jakarta.validation.constraints.FutureOrPresent;

import java.time.LocalDate;
import java.time.LocalTime;

// DTO para receber os dados de atualização de uma atividade.
// Todos os campos são opcionais.
public record AtividadeUpdateDTO(
        String titulo,
        String observacoes,
        @FutureOrPresent(message = "A data não pode ser no passado")
        LocalDate data,
        LocalTime horario,
        String cep,
        String uf,
        String street,
        Integer capacidade,
        Boolean semLimite,
        String status // Permitimos que o criador altere o status (ex: para CANCELAR)
) {
}