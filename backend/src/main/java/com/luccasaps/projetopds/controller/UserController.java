package com.luccasaps.projetopds.controller;

import com.luccasaps.projetopds.controller.dto.UserDTO;
import com.luccasaps.projetopds.controller.dto.UserResponseDTO;
import com.luccasaps.projetopds.controller.mappers.UserResponseMapper;
import com.luccasaps.projetopds.model.User;
import com.luccasaps.projetopds.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController implements GenericController {

    private final UserService userService;
    private final UserResponseMapper userResponseMapper;

    @PostMapping
    public ResponseEntity<UserResponseDTO> save(@RequestBody @Valid UserDTO userDTO){
        User user = userService.save(userDTO);

        UserResponseDTO userResponse = userResponseMapper.toResponseDTO(user);

        URI location = gerarHeaderLocation(userResponse.id());
        return ResponseEntity.created(location).body(userResponse);
    }
}
