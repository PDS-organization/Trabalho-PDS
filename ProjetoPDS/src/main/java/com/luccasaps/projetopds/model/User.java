package com.luccasaps.projetopds.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;


@Getter
@Setter
@Entity
@Table(name = "usuarios",schema = "public")
@EntityListeners(AuditingEntityListener.class)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String userName;

    @Column(nullable = false)
    private String email;

    @Column(name = "data_nascimento" ,nullable = false)
    private LocalDate dataNascimento;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String phone;

    @CreatedDate
    @Column(name = "data_cadastro")
    private LocalDateTime dataCadastro;
}
