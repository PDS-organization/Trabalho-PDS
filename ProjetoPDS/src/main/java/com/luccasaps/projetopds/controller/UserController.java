package com.luccasaps.projetopds.controller;

import com.luccasaps.projetopds.controller.dto.UserDTO;
import com.luccasaps.projetopds.controller.mappers.UserMapper;
import com.luccasaps.projetopds.model.User;
import com.luccasaps.projetopds.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController implements GenericController {

    private final UserService userService;
    private final UserMapper userMapper;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<Void> save(@RequestBody @Valid UserDTO userDTO){
        User user = userMapper.toEntity(userDTO);
        userService.save(user);

        URI location = gerarHeaderLocation(user.getId());

        return ResponseEntity.created(location).build();
    }
}
