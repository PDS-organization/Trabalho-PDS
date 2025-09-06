package com.luccasaps.projetopds.controller;

import com.luccasaps.projetopds.controller.dto.AtividadeCreateDTO;
import com.luccasaps.projetopds.controller.dto.AtividadeUpdateDTO;
import com.luccasaps.projetopds.model.Atividade;
import com.luccasaps.projetopds.service.AtividadeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/atividades")
@RequiredArgsConstructor
public class AtividadeController implements GenericController {

    private final AtividadeService atividadeService;

    @PostMapping
    public ResponseEntity<Void> create(@RequestBody AtividadeCreateDTO dto, Authentication authentication) {
        // 'authentication.getName()' irá conter o email do usuário logado (do token JWT)

        Atividade atividade = atividadeService.create(dto, authentication.getName());

        URI location = gerarHeaderLocation(atividade.getId());

        return ResponseEntity.created(location).build(); // Retorna 201 Created
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> update(
            @PathVariable UUID id,
            @RequestBody @Valid AtividadeUpdateDTO dto,
            Authentication authentication) {

        String username = authentication.getName();
        atividadeService.update(id, dto, username);

        // Retorna 204 No Content, indicando que a atualização foi bem-sucedida, mas não há corpo na resposta.
        // Ou você pode retornar 200 OK com o objeto atualizado se preferir.
        return ResponseEntity.noContent().build();
    }
}