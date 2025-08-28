package com.luccasaps.projetopds.repository;

import com.luccasaps.projetopds.model.Modalidade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ModalidadeRepository extends JpaRepository<Modalidade, Long> {

    List<Modalidade> findByNomeIn(List<String> nomes);

}
