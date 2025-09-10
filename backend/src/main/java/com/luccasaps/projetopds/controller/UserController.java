package com.luccasaps.projetopds.controller;

import com.luccasaps.projetopds.controller.dto.PageResponseDTO;
import com.luccasaps.projetopds.controller.dto.UserDTO;
import com.luccasaps.projetopds.controller.dto.UserResponseDTO;
import com.luccasaps.projetopds.controller.dto.UserUpdateDTO;
import com.luccasaps.projetopds.controller.mappers.UserMapper;
import com.luccasaps.projetopds.model.User;
import com.luccasaps.projetopds.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController implements GenericController {

    private final UserService userService;
    private final UserMapper userMapper;

    @PostMapping("/register")
    public ResponseEntity<UserResponseDTO> register(@RequestBody @Valid UserDTO userDTO){
        User user = userService.save(userDTO);

        UserResponseDTO userResponse = userMapper.toResponseDTO(user);

        URI location = gerarHeaderLocation(userResponse.id());
        return ResponseEntity.created(location).body(userResponse);
    }

    @GetMapping
    public ResponseEntity<PageResponseDTO<UserResponseDTO>> findAll(Pageable pageable){
        Page<User> userPage = userService.findAll(pageable);
        Page<UserResponseDTO> userResponsePage = userPage.map(userMapper::toResponseDTO);

        PageResponseDTO<UserResponseDTO> response = new PageResponseDTO<>(
                userResponsePage.getContent(),
                userResponsePage.getNumber(),
                userResponsePage.getTotalElements(),
                userResponsePage.getTotalPages()
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{username}")
    public ResponseEntity<UserResponseDTO> findByUsername(@PathVariable String username){
        UserResponseDTO userResponseDTO = userService.findByUsername(username);
        return ResponseEntity.ok().body(userResponseDTO);
    }

    @PutMapping
    public ResponseEntity<UserResponseDTO> update(@RequestBody @Valid UserUpdateDTO userUpdateDTO, Authentication authentication){

        String username = authentication.getName();

        User updateUser = userService.update(username,userUpdateDTO);

        return ResponseEntity.ok(userMapper.toResponseDTO(updateUser));
    }

    @DeleteMapping("/me")
    @ResponseStatus(HttpStatus.NO_CONTENT) // Retorna 204 No Content em caso de sucesso
    public void deleteSelf(Authentication authentication) {
        String username = authentication.getName();
        userService.deleteSelf(username);
    }
}
