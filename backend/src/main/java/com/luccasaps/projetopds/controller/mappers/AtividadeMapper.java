package com.luccasaps.projetopds.controller.mappers;

import com.luccasaps.projetopds.controller.dto.AtividadeCreateDTO;
import com.luccasaps.projetopds.controller.dto.AtividadeUpdateDTO;
import com.luccasaps.projetopds.model.Atividade;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface AtividadeMapper {

    @Mapping(target = "modalidade", ignore = true)
    Atividade toEntity(AtividadeCreateDTO atividadeCreateDTO);

    @Mapping(target = "modalidade", ignore = true)
    AtividadeCreateDTO toCreateDTO(Atividade atividade);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateAtividadeFromDto(AtividadeUpdateDTO dto, @MappingTarget Atividade atividade);
}
