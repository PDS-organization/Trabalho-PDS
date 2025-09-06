package com.luccasaps.projetopds.service;

import com.luccasaps.projetopds.controller.dto.UserDTO;
import com.luccasaps.projetopds.controller.dto.UserUpdateDTO;
import com.luccasaps.projetopds.controller.mappers.UserMapper;
import com.luccasaps.projetopds.model.Modalidade;
import com.luccasaps.projetopds.model.User;
import com.luccasaps.projetopds.repository.ModalidadeRepository;
import com.luccasaps.projetopds.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.*;


@Service
@RequiredArgsConstructor
public class UserService{

    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final ModalidadeRepository modalidadeRepository;
    private final UserMapper userMapper;

    @Transactional
    public User save(UserDTO userDTO){

        if(userRepository.findByEmail(userDTO.email()).isPresent()){
            throw new RuntimeException("Este email já está em uso.");
        }

        User user = userMapper.toEntity(userDTO);

        user.setPassword(passwordEncoder.encode(user.getPassword()));

        user.setCep(userDTO.cep().replaceAll("\\D", ""));
        user.setUf(userDTO.uf().toUpperCase(Locale.ROOT));
        user.setStreet(userDTO.street());

        // 3. Processa e associa as modalidades
        List<String> modalidadesNomes = userDTO.modalidadesNomes();
        if (modalidadesNomes != null && !modalidadesNomes.isEmpty()) {
            List<Modalidade> modalidades = modalidadeRepository.findByNomeIn(modalidadesNomes);
            if (modalidades.size() != modalidadesNomes.size()) {
                throw new EntityNotFoundException("Uma ou mais modalidades não existem.");
            }
            user.setModalidades(new HashSet<>(modalidades));
        }

        // 4. Salva e RETORNA a entidade persistida
        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public Page<User> findAll(Pageable pageable){
        return userRepository.findAll(pageable);
    }

    @Transactional
    public User update(String username, UserUpdateDTO userUpdateDTO){

        User user = userRepository.findOptionalByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado: " + username));

        // 2. Usa o mapper para atualizar os campos simples (name, email, phone, etc.)
        // O mapper irá ignorar automaticamente qualquer campo que seja nulo no DTO.
        userMapper.updateEntityFromDTO(userUpdateDTO, user);

        // 3. Lógica especial para a senha: só atualiza se uma nova for enviada
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
}
