package com.luccasaps.projetopds.controller.mappers;

import com.luccasaps.projetopds.controller.dto.ApiResponseDTO;
import com.luccasaps.projetopds.controller.dto.ModalidadeDTO;
import com.luccasaps.projetopds.model.Modalidade;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ModalidadeMapper {

    ModalidadeDTO toDTO(Modalidade nome);

    List<ModalidadeDTO> toDTO(List<Modalidade> modalidades);
}
