package com.luccasaps.projetopds.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;


@Getter
@Setter
@Entity
@Table(name = "usuarios",schema = "public")
@EntityListeners(AuditingEntityListener.class)
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "genero", length = 20)
    private Genero genero;

    @Column(name = "user_name", nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "data_nascimento" ,nullable = false)
    private LocalDate dataNascimento;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String phone;

    @Column(length = 9, nullable = false)
    private String cep;

    @Column(length = 2, nullable = false)
    private String uf;

    @Column(length = 120, nullable = false)
    private String street;

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

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of();
    }

    @Override
    public String getUsername() {
        return this.username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
