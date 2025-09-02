package com.luccasaps.projetopds.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;


import java.util.Arrays;

/**
 * Configuração de segurança do Spring Security
 *
 * Mantém a funcionalidade original com melhorias de:
 * - Headers de segurança adicionais
 * - Configuração CORS básica
 * - Melhor organização de código
 * - Comentários explicativos
 */
@Configuration
@EnableWebSecurity
public class SecurityConfiguration {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Configuração das regras de autorização para requisições HTTP
                .cors(cors -> {})
                // Inicia a configuração das regras de autorização para as requisições HTTP
                .authorizeHttpRequests(authorize -> authorize
                        // Permite acesso irrestrito ao H2 Console (desenvolvimento)
                        .requestMatchers("/h2-console/**").permitAll()

                        // Permite criação de usuários
                        .requestMatchers(HttpMethod.POST, "/users/**").permitAll()

                        // Endpoints comuns que podem precisar ser públicos
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/actuator/health").permitAll()
                        .requestMatchers("/error").permitAll()

                        // Documentação da API (Swagger)
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()

                        // Para todas as outras requisições - MANTÉM ORIGINAL
                        .anyRequest().permitAll()
                )

                // Configuração de headers de segurança (melhorias sem quebrar funcionalidade)
                .headers(headers -> headers
                        // Mantém configuração original para H2
                        .frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin)

                        // Adiciona headers de segurança básicos
                        .contentTypeOptions(HeadersConfigurer.ContentTypeOptionsConfig::and)
                        .httpStrictTransportSecurity(hstsConfig -> hstsConfig
                                .maxAgeInSeconds(31536000)
                                .includeSubdomains(false) // Menos restritivo para desenvolvimento
                        )
                )

                // Configuração CSRF - MANTÉM ORIGINAL (desabilitado)
                .csrf(AbstractHttpConfigurer::disable)

                // Adiciona configuração CORS básica
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // Configuração de sessão (adiciona controles básicos)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                        .maximumSessions(5) // Permite até 5 sessões simultâneas
                        .maxSessionsPreventsLogin(false)
                );

        return http.build();
    }

    /**
     * Mantém o mesmo PasswordEncoder original
     */
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

    /**
     * Configuração CORS permissiva para desenvolvimento
     * Pode ser restringida posteriormente em produção
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Permite todas as origens em desenvolvimento (pode ser restringido depois)
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));

        // Permite os métodos HTTP mais comuns
        configuration.setAllowedMethods(Arrays.asList(
                HttpMethod.GET.name(),
                HttpMethod.POST.name(),
                HttpMethod.PUT.name(),
                HttpMethod.DELETE.name(),
                HttpMethod.PATCH.name(),
                HttpMethod.OPTIONS.name()
        ));

        // Permite todos os headers
        configuration.setAllowedHeaders(Arrays.asList("*"));

        // Permite credenciais
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}