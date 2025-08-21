package com.luccasaps.projetopds.controller;

import com.luccasaps.projetopds.controller.dto.ApiResponseDTO;
import com.luccasaps.projetopds.controller.dto.ModalidadeDTO;
import com.luccasaps.projetopds.controller.mappers.ModalidadeMapper;
import com.luccasaps.projetopds.model.Modalidade;
import com.luccasaps.projetopds.service.ModalidadeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/modalidades")
@RequiredArgsConstructor
public class ModalidadeController {

    private final ModalidadeMapper modalidadeMapper;
    private final ModalidadeService modalidadeService;

    @GetMapping
    public ResponseEntity<ApiResponseDTO<List<ModalidadeDTO>>> getAllModalidades(){

        List<Modalidade> modalidades = modalidadeService.findAll();

        List<ModalidadeDTO> modalidadesDTO = modalidadeMapper.toDTO(modalidades);

        ApiResponseDTO<List<ModalidadeDTO>> response = new ApiResponseDTO<>(modalidadesDTO);

        return ResponseEntity.ok(response);

    }
}
