package com.luccasaps.projetopds.controller;

import com.luccasaps.projetopds.controller.dto.AtividadeCreateDTO;
import com.luccasaps.projetopds.controller.dto.AtividadeResponseDTO;
import com.luccasaps.projetopds.controller.dto.AtividadeUpdateDTO;
import com.luccasaps.projetopds.controller.dto.PageResponseDTO;
import com.luccasaps.projetopds.controller.mappers.AtividadeMapper;
import com.luccasaps.projetopds.model.Atividade;
import com.luccasaps.projetopds.service.AtividadeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/atividades")
@RequiredArgsConstructor
public class AtividadeController implements GenericController {

    private final AtividadeService atividadeService;
    private final AtividadeMapper atividadeMapper;

    @PostMapping
    public ResponseEntity<AtividadeResponseDTO> create(@RequestBody AtividadeCreateDTO dto, Authentication authentication) {
        // 'authentication.getName()' irá conter o email do usuário logado (do token JWT)

        Atividade atividade = atividadeService.create(dto, authentication.getName());

        URI location = gerarHeaderLocation(atividade.getId());

        AtividadeResponseDTO responseDTO = atividadeMapper.toResponseDTO(atividade);

        return ResponseEntity.created(location).body(responseDTO); // Retorna 201 Created
    }

    /**
     * Endpoint para o usuário autenticado se inscrever em uma atividade.
     * @param id O UUID da atividade, vindo da URL.
     * @param authentication Objeto com os dados do usuário logado.
     */
    @PostMapping("/{id}/inscrever")
    @ResponseStatus(HttpStatus.NO_CONTENT) // Retorna 204 No Content em caso de sucesso
    public void inscreverEmAtividade(@PathVariable UUID id, Authentication authentication) {
        String username = authentication.getName();
        atividadeService.inscrever(id, username);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> update(
            @PathVariable UUID id,
            @RequestBody @Valid AtividadeUpdateDTO dto,
            Authentication authentication) {

        String username = authentication.getName();
        atividadeService.update(id, dto, username);

        // Retorna 204 No Content, indicando que a atualização foi bem-sucedida, mas não há corpo na resposta.
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<PageResponseDTO<AtividadeResponseDTO>> findAll(Pageable pageable) {
        Page<Atividade> atividadePage = atividadeService.findAllPaginated(pageable);
        Page<AtividadeResponseDTO> responsePage = atividadePage.map(atividadeMapper::toResponseDTO);

        // Cria a resposta customizada
        PageResponseDTO<AtividadeResponseDTO> response = new PageResponseDTO<>(
                responsePage.getContent(),
                responsePage.getNumber(),
                responsePage.getTotalElements(),
                responsePage.getTotalPages()
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/proximas")
    public ResponseEntity<PageResponseDTO<AtividadeResponseDTO>> findNearby(
            @RequestParam String cep,
            @RequestParam(defaultValue = "10.0") Double distancia,
            Pageable pageable) { // <-- Recebe o objeto Pageable

        Page<Atividade> atividadePage = atividadeService.findNearbyPaginated(cep, distancia, pageable);

        // A lógica de mapeamento para DTO
        Page<AtividadeResponseDTO> responsePage = atividadePage.map(atividadeMapper::toResponseDTO);

        PageResponseDTO<AtividadeResponseDTO> response = new PageResponseDTO<>(
                responsePage.getContent(),
                responsePage.getNumber(),
                responsePage.getTotalElements(),
                responsePage.getTotalPages()
        );

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT) // Retorna 204 No Content em caso de sucesso
    public void delete(@PathVariable UUID id, Authentication authentication) {
        String username = authentication.getName();
        atividadeService.deleteById(id, username);
    }
}