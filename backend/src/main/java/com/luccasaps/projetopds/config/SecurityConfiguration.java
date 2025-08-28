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

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfiguration{

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> {})
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
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();

        // Em dev, liste explicitamente as origens do front:
        cfg.setAllowedOrigins(List.of(
                "http://localhost:3000",
                "http://127.0.0.1:3000"
        ));
        // Se preferir padrão por host (cuidado em prod):
        // cfg.setAllowedOriginPatterns(List.of("http://localhost:*"));

        cfg.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));
        // Se for usar cookies/Authorization:
        cfg.setAllowCredentials(true);

        // Se quiser ler cabeçalhos como Location no cliente:
        cfg.setExposedHeaders(List.of("Location"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // Aplica para todas as rotas
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }
}
