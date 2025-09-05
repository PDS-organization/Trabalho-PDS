package com.luccasaps.projetopds.repository;

import com.luccasaps.projetopds.model.Atividade;
import com.luccasaps.projetopds.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AtividadeRepository extends JpaRepository<Atividade, UUID> {
    Atividade findByTitulo(String nome);

    List<Atividade> findByCriador(User criador);

    List<Atividade> findByModalidadeNomeIn(List<String> nomes);
}
