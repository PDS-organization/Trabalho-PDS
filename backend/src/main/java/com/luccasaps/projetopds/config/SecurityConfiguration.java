package com.luccasaps.projetopds.config;

import com.luccasaps.projetopds.model.User;
import com.luccasaps.projetopds.repository.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@AllArgsConstructor
public class SecurityConfiguration{


    private final SecurityFilter securityFilter;

    private final UserRepository userRepository;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                // Essencial para APIs REST e JWT, pois o servidor não guarda estado de sessão.
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // Inicia a configuração das regras de autorização para as requisições HTTP
                .authorizeHttpRequests(authorize -> authorize
                        // Permite o acesso irrestrito a todas as requisições para o H2 Console
                        .requestMatchers(HttpMethod.POST, "/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/users/register").permitAll()
                        .requestMatchers("/h2-console/**").permitAll()
                        //.requestMatchers(HttpMethod.POST, "/users/**").permitAll()
                        // Para todas as outras requisições, exige que o usuário esteja autenticado
                        .anyRequest().authenticated()
                )
                .addFilterBefore(securityFilter, UsernamePasswordAuthenticationFilter.class)
                // O console H2 usa frames, que são desabilitados por padrão pelo Spring Security.
                // Esta linha reabilita o suporte a frames, mas apenas para a mesma origem (necessário para o H2).
                .headers(headers -> headers
                        .frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin)
                );

        // Retorna o objeto HttpSecurity configurado para ser usado pelo Spring Security
        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return email -> {
            // 1. Chama o novo método findByEmail, que retorna 'User' ou 'null'
            User user = userRepository.findByEmail(email);

            // 2. Verifica se o usuário foi encontrado
            if (user == null) {
                // 3. Se não foi encontrado, lança a exceção
                throw new UsernameNotFoundException("Usuário não encontrado com o e-mail: " + email);
            }

            // 4. Se foi encontrado, retorna o objeto User
            return user;
        };
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }
}
