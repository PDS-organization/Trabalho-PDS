package com.luccasaps.projetopds.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfiguration{

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Inicia a configuração das regras de autorização para as requisições HTTP
                .authorizeHttpRequests(authorize -> authorize
                        // Permite o acesso irrestrito a todas as requisições para o H2 Console
                        .requestMatchers("/h2-console/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/users/**").permitAll()
                        // Para todas as outras requisições, exige que o usuário esteja autenticado
                        .anyRequest().permitAll()
                )
                // O console H2 usa frames, que são desabilitados por padrão pelo Spring Security.
                // Esta linha reabilita o suporte a frames, mas apenas para a mesma origem (necessário para o H2).
                .headers(headers -> headers
                        .frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin)
                )
                // Desabilita a proteção CSRF (Cross-Site Request Forgery) apenas para o console H2.
                // O console H2 não tem suporte para tokens CSRF, então precisamos desabilitar para ele funcionar.
                .csrf(AbstractHttpConfigurer::disable);
                //.csrf(csrf -> csrf
                //        .ignoringRequestMatchers("/h2-console/**")
                //);

        // Retorna o objeto HttpSecurity configurado para ser usado pelo Spring Security
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }
}
