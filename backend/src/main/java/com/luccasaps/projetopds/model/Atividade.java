package com.luccasaps.projetopds.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "Atividade",schema = "public")
@EntityListeners(AuditingEntityListener.class)
public class Atividade {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Relacionamento: Quem criou a atividade. Muitas atividades para um usuário.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "criador_id", nullable = false)
    private User criador;

    // Relacionamento: Qual o esporte da atividade. Muitas atividades para uma modalidade.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "modalidade_id", nullable = false)
    private Modalidade modalidade; // Campo "Selecione o esporte"

    @Column(length = 50, nullable = false)
    private String titulo; // Campo "Título da atividade"

    @Column(length = 500)
    private String observacoes; // Campo "Observações"

    @Column(nullable = false)
    private LocalDate data; // Campo "Selecione a data"

    @Column(nullable = false)
    private LocalTime horario; // Campo de hora

    // --- Informações de Endereço ---
    @Column(length = 9)
    private String cep; // Campo de CEP

    @Column(length = 2)
    private String uf; // Campo "UF"

    @Column(length = 120)
    private String street; // Campo "Rua Exemplo 123"

    // --- Capacidade e Status ---
    private Integer capacidade; // Campo "Capacidade"

    @Column(nullable = false)
    private boolean semLimite; // Campo checkbox "Sem limite"

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusAtividade status; // Campos "Open", "Closed", "Canceled"

    // Relacionamento: Quem são os participantes. Muitas atividades para muitos usuários.
    @ManyToMany
    @JoinTable(
            name = "atividade_participantes",
            joinColumns = @JoinColumn(name = "atividade_id"),
            inverseJoinColumns = @JoinColumn(name = "usuario_id")
    )
    private Set<User> participantes = new HashSet<>();

    // --- Datas de Auditoria ---
    @CreatedDate
    @Column(name = "criado_em", updatable = false)
    private LocalDateTime criadoEm;

    @LastModifiedDate
    @Column(name = "atualizado_em")
    private LocalDateTime atualizadoEm;
}