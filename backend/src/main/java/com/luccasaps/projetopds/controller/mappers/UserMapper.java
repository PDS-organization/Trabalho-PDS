package com.luccasaps.projetopds.controller.mappers;

import com.luccasaps.projetopds.controller.dto.UserDTO;
import com.luccasaps.projetopds.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "dataCadastro", ignore = true)
    @Mapping(target = "modalidades", ignore = true)
    User toEntity(UserDTO userDTO);
}
