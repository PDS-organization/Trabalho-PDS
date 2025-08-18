package com.luccasaps.projetopds.controller.mappers;

import com.luccasaps.projetopds.controller.dto.UserDTO;
import com.luccasaps.projetopds.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {
    @Mapping(source = "name", target = "name")
    @Mapping(source = "userName", target = "userName")
    @Mapping(source = "email", target = "email")
    @Mapping(source = "dataNascimento", target = "dataNascimento")
    @Mapping(source = "phone", target = "phone")
    @Mapping(source = "password", target = "password")

    User toEntity(UserDTO userDTO);

    UserDTO toDTO(User user);
}
