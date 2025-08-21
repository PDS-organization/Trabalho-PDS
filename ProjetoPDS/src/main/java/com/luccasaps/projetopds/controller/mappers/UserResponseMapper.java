package com.luccasaps.projetopds.controller.mappers;

import com.luccasaps.projetopds.controller.dto.UserDTO;
import com.luccasaps.projetopds.controller.dto.UserResponseDTO;
import com.luccasaps.projetopds.model.Modalidade;
import com.luccasaps.projetopds.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface UserResponseMapper {

    @Mapping(target = "modalidades", source = "modalidadesNomes")

    UserResponseDTO toResponseDTO(UserDTO userDTO);

    UserResponseDTO toResponseDTO(User user);

    default List<String> mapModalidadesToNomes(Set<Modalidade> modalidades) {
        if (modalidades == null || modalidades.isEmpty()) {
            return Collections.emptyList();
        }

        // Usamos Streams para transformar a coleção de objetos em uma lista de nomes
        return modalidades.stream()
                .map(Modalidade::getNome) // Para cada objeto Modalidade, pegue o nome (String)
                .sorted()                 // (Opcional) Ordena a lista de nomes alfabeticamente
                .collect(Collectors.toList()); // Junta tudo em uma nova List<String>
    }

    UserDTO toDTO(UserResponseDTO userResponseDTO);
}
