package com.luccasaps.projetopds.controller;

import com.luccasaps.projetopds.controller.dto.DadosAutenticacaoDTO;
import com.luccasaps.projetopds.controller.dto.DadosTokenJWTDTO;
import com.luccasaps.projetopds.model.User;
import com.luccasaps.projetopds.service.TokenService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/login")
@RequiredArgsConstructor
public class AutenticacaoController {

    private final AuthenticationManager manager; // Bean que injetamos na SecurityConfiguration

    private final TokenService tokenService;

    @PostMapping
    public ResponseEntity<DadosTokenJWTDTO> efetuarLogin(@RequestBody @Valid DadosAutenticacaoDTO dados) {
        // 1. Cria um objeto de autenticação com as credenciais recebidas
        var authenticationToken = new UsernamePasswordAuthenticationToken(dados.username(), dados.password());

        // 2. Chama o AuthenticationManager do Spring Security para validar as credenciais
        //    Ele irá usar o nosso PasswordEncoder e buscar o usuário no banco para comparar
        Authentication authentication = manager.authenticate(authenticationToken);

        // 3. Se a autenticação for bem-sucedida, pega o objeto User autenticado
        var user = (User) authentication.getPrincipal();

        // 4. Gera o token JWT com base nos dados do usuário
        var tokenJWT = tokenService.gerarToken(user);

        // 5. Retorna o token em um DTO com status 200 OK
        return ResponseEntity.ok(new DadosTokenJWTDTO(tokenJWT));
    }
}