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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
@AllArgsConstructor
public class SecurityFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(SecurityFilter.class);

    private final TokenService tokenService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        try {
            String tokenJWT = recuperarToken(request);

            if (tokenJWT != null && !tokenJWT.isBlank() && SecurityContextHolder.getContext().getAuthentication() == null) {
                String subject = tokenService.getSubject(tokenJWT); // pode ser null se inválido/expirado
                log.debug("JWT subject: {}", subject);

                if (subject != null && !subject.isBlank()) {
                    // 👇 use ignore-case pra não falhar por maiúsculas/minúsculas
                    User user = userRepository.findByEmailIgnoreCase(subject).orElse(null);
                    if (user != null) {
                        var authorities = user.getAuthorities();
                        if (authorities == null) authorities = Collections.emptyList();

                        var authentication = new UsernamePasswordAuthenticationToken(
                                user, null, authorities
                        );
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                        SecurityContextHolder.getContext().setAuthentication(authentication);
                        log.debug("JWT authenticated: principal={}, authorities={}", user.getEmail(), authorities);
                    } else {
                        log.debug("User not found for email (ignore-case): {}", subject);
                        SecurityContextHolder.clearContext();
                    }
                } else {
                    log.debug("Invalid/expired JWT (no subject)");
                    SecurityContextHolder.clearContext();
                }
            }
        } catch (Exception e) {
            // qualquer falha não deve virar 500
            log.debug("SecurityFilter error: {}", e.toString());
            SecurityContextHolder.clearContext();
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
