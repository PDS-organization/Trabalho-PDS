package com.luccasaps.projetopds.controller.mappers;

import com.luccasaps.projetopds.controller.dto.AtividadeCreateDTO;
import com.luccasaps.projetopds.controller.dto.AtividadeResponseDTO;
import com.luccasaps.projetopds.controller.dto.AtividadeUpdateDTO;
import com.luccasaps.projetopds.model.Atividade;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring")
public interface AtividadeMapper {

    @Mapping(target = "modalidade", ignore = true)
    Atividade toEntity(AtividadeCreateDTO atividadeCreateDTO);

    @Mapping(target = "modalidade", ignore = true)
    AtividadeCreateDTO toCreateDTO(Atividade atividade);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateAtividadeFromDto(AtividadeUpdateDTO dto, @MappingTarget Atividade atividade);

    /**
     * Mapeia a entidade Atividade para o DTO de resposta.
     * Usa a notação "source.field" para acessar campos de entidades relacionadas.
     */
    @Mapping(source = "criador.id", target = "criadorId")
    @Mapping(source = "criador.name", target = "criadorNome")
    @Mapping(source = "modalidade.nome", target = "modalidadeNome")
    @Mapping(target = "participantesCount", expression = "java(atividade.getParticipantes().size())")
    AtividadeResponseDTO toResponseDTO(Atividade atividade);

    // Método para converter uma lista de entidades para uma lista de DTOs
    List<AtividadeResponseDTO> toResponseDTOList(List<Atividade> atividades);
}
