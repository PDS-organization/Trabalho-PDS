package com.luccasaps.projetopds;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@EnableJpaAuditing
@SpringBootApplication
public class ProjetoPdsApplication {

    public static void main(String[] args) {
        SpringApplication.run(ProjetoPdsApplication.class, args);
        System.out.println("Projeto PDS Iniciado!");
    }
}
