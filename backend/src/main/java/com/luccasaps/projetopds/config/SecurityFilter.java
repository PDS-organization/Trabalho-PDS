// src/main/java/com/luccasaps/projetopds/config/SecurityFilter.java
package com.luccasaps.projetopds.config;

import com.luccasaps.projetopds.model.User;
import com.luccasaps.projetopds.repository.UserRepository;
import com.luccasaps.projetopds.service.TokenService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@AllArgsConstructor
public class SecurityFilter extends OncePerRequestFilter {

    private final TokenService tokenService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String tokenJWT = recuperarToken(request);

        if (tokenJWT != null && !tokenJWT.isBlank()) {
            try {
                // subject agora é o E-MAIL (ajustado no TokenService)
                String subject = tokenService.getSubject(tokenJWT);

                User user = userRepository.findByEmail(subject).orElse(null);
                if (user != null) {
                    var authentication = new UsernamePasswordAuthenticationToken(
                            user, null, user.getAuthorities()
                    );
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            } catch (Exception ex) {
                // Token inválido/expirado → apenas não autentica
                // (rotas públicas continuam acessíveis; rotas protegidas exigirão auth)
            }
        }

        filterChain.doFilter(request, response);
    }

    private String recuperarToken(HttpServletRequest request) {
        String authorizationHeader = request.getHeader("Authorization");
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            return authorizationHeader.substring("Bearer ".length());
        }
        return null;
    }
}
