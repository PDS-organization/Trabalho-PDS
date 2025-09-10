package com.luccasaps.projetopds.service;

import com.luccasaps.projetopds.controller.dto.UserDTO;
import com.luccasaps.projetopds.controller.dto.UserResponseDTO;
import com.luccasaps.projetopds.controller.dto.UserUpdateDTO;
import com.luccasaps.projetopds.controller.mappers.UserMapper;
import com.luccasaps.projetopds.model.Atividade;
import com.luccasaps.projetopds.model.Modalidade;
import com.luccasaps.projetopds.model.User;
import com.luccasaps.projetopds.repository.AtividadeRepository;
import com.luccasaps.projetopds.repository.ModalidadeRepository;
import com.luccasaps.projetopds.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;


@Service
@RequiredArgsConstructor
public class UserService{

    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final ModalidadeRepository modalidadeRepository;
    private final UserMapper userMapper;
    private final AtividadeRepository atividadeRepository;

    @Transactional
    public User save(UserDTO userDTO){

        // normaliza para consistência
        final String email = userDTO.email().toLowerCase(Locale.ROOT);
        final String username = userDTO.username().toLowerCase(Locale.ROOT); // ajuste ao seu DTO

        // checa e-mail duplicado
        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            // 409 + code legível para o front
            throw new ResponseStatusException(HttpStatus.CONFLICT, "EMAIL_TAKEN");
        }

        // (opcional, mas recomendado) checar username duplicado também
        if (userRepository.findOptionalByUsername(username).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "USERNAME_TAKEN");
        }

        User user = userMapper.toEntity(userDTO);

        user.setEmail(email);
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setCep(userDTO.cep().replaceAll("\\D", ""));
        user.setUf(userDTO.uf().toUpperCase(Locale.ROOT));
        user.setStreet(userDTO.street());

        // Modalidades
        List<String> modalidadesNomes = userDTO.modalidadesNomes();
        if (modalidadesNomes != null && !modalidadesNomes.isEmpty()) {
            // garanta que já venham MAIÚSCULAS do front, mas dá pra forçar aqui:
            List<String> upper = modalidadesNomes.stream()
                    .filter(Objects::nonNull)
                    .map(s -> s.toUpperCase(Locale.ROOT))
                    .toList();

            List<Modalidade> modalidades = modalidadeRepository.findByNomeIn(upper);
            if (modalidades.size() != upper.size()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "MODALIDADE_INVALIDA");
            }
            user.setModalidades(new HashSet<>(modalidades));
        }

        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public Page<User> findAll(Pageable pageable){
        return userRepository.findAll(pageable);
    }

    @Transactional
    public UserResponseDTO findByUsername(String username){
        User user = userRepository.findOptionalByUsername(username).orElseThrow(() -> new EntityNotFoundException("Usuario não encontrado com username: " + username));

        return userMapper.toResponseDTO(user);
    }

    @Transactional
    public User update(String username, UserUpdateDTO userUpdateDTO){

        User user = userRepository.findOptionalByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado: " + username));


        userMapper.updateEntityFromDTO(userUpdateDTO, user);

        if (StringUtils.hasText(userUpdateDTO.password())) {
            user.setPassword(passwordEncoder.encode(userUpdateDTO.password()));
        }

        // 4. Lógica para atualizar as modalidades
        if (userUpdateDTO.modalidadesNomes() != null) {
            List<Modalidade> modalidades = modalidadeRepository.findByNomeIn(userUpdateDTO.modalidadesNomes());
            user.setModalidades(new HashSet<>(modalidades));
        }

        return user;
    }

    @Transactional
    public void deleteSelf(String username) {
        // 1. Busca o usuário que será excluído.
        User user = userRepository.findOptionalByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado: " + username));

        // 2. Busca e exclui todas as atividades criadas por este usuário para evitar erros de chave estrangeira.
        List<Atividade> atividadesCriadas = atividadeRepository.findAllByCriador(user);
        if (!atividadesCriadas.isEmpty()) {
            atividadeRepository.deleteAll(atividadesCriadas);
        }

        // 3. Agora, com as dependências removidas, exclui o usuário.
        // O JPA cuidará de remover as associações em tabelas de junção (como user_modalidade).
        userRepository.delete(user);
    }
}
