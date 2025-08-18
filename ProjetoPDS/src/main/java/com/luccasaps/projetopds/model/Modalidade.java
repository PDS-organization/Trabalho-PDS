package com.luccasaps.projetopds.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.Set;
import java.util.HashSet;

@Entity
@Table(name = "modalidade",schema = "public")
@Getter
@Setter
public class Modalidade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String nome;

    // O 'mappedBy' indica que a entidade 'Usuario' é a dona do relacionamento.
    @ManyToMany(mappedBy = "modalidades")
    private Set<User> usuarios = new HashSet<>();
}
