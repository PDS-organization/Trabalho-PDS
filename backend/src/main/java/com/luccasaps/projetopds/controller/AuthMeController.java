// src/main/java/com/luccasaps/projetopds/controller/AuthMeController.java
package com.luccasaps.projetopds.controller;

import com.luccasaps.projetopds.controller.dto.UserResponseDTO;
import com.luccasaps.projetopds.controller.mappers.UserMapper;
import com.luccasaps.projetopds.model.User;
import com.luccasaps.projetopds.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class AuthMeController {

    private final UserMapper userMapper;
    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<UserResponseDTO> me(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Object principal = auth.getPrincipal();

        // Se vier User no principal
        if (principal instanceof User u) {
            // recarrega com fetch-join para evitar LazyInitializationException
            User userLoaded = userRepository
                    .findByEmailIgnoreCaseFetchModalidades(u.getEmail())
                    .orElse(u); // fallback: se não achar (não deve acontecer), usa o próprio
            return ResponseEntity.ok(userMapper.toResponseDTO(userLoaded));
        }

        // Se vier String (email) no principal
        if (principal instanceof String email && !email.isBlank()) {
            return userRepository.findByEmailIgnoreCaseFetchModalidades(email)
                    .map(userMapper::toResponseDTO)
                    .map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
}