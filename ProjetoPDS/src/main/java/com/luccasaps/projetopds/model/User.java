package com.luccasaps.projetopds.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;

import java.time.LocalDateTime;
import java.util.UUID;

@AllArgsConstructor
@NoArgsConstructor
@Entity
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column
    private UUID id;

    @Column
    private String name;

    @Column
    private String password;

    @Column
    private String phone;

    @CreatedDate
    @Column(name = "data_cadastro")
    private LocalDateTime dataCadastro;

}
