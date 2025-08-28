package com.luccasaps.projetopds.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
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

    @Enumerated(EnumType.STRING)
    @Column(name = "genero", length = 20)
    private Genero genero;

    @Column(nullable = false)
    private String userName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "data_nascimento" ,nullable = false)
    private LocalDate dataNascimento;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String phone;

    @ManyToMany(fetch = FetchType.LAZY, cascade = { CascadeType.PERSIST, CascadeType.MERGE })
    @JoinTable(
            name = "user_modalidade", // Nome da tabela de junção
            joinColumns = @JoinColumn(name = "user_id"), // Coluna que referencia a entidade Usuario
            inverseJoinColumns = @JoinColumn(name = "modalidade_id") // Coluna que referencia a outra entidade (Modalidade)
    )
    private Set<Modalidade> modalidades = new HashSet<>();

    @CreatedDate
    @Column(name = "data_cadastro")
    private LocalDateTime dataCadastro;
}
