package com.luccasaps.projetopds.repository;

import com.luccasaps.projetopds.model.Atividade;
import com.luccasaps.projetopds.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface AtividadeRepository extends JpaRepository<Atividade, UUID> {
    Atividade findByTitulo(String nome);

    List<Atividade> findByCriador(User criador);

    List<Atividade> findByModalidadeNomeIn(List<String> nomes);

    /**
     * Busca uma 'página' de atividades dentro de um raio de distância (em km).
     * Inclui parâmetros para LIMIT (pageSize) e OFFSET (offset) para a paginação manual.
     */
    @Query(value = "SELECT *, (6371 * acos(cos(radians(:lat)) * cos(radians(a.latitude)) * cos(radians(a.longitude) - radians(:lon)) + sin(radians(:lat)) * sin(radians(a.latitude)))) AS distancia " +
            "FROM atividade a " +
            "WHERE (6371 * acos(cos(radians(:lat)) * cos(radians(a.latitude)) * cos(radians(a.longitude) - radians(:lon)) + sin(radians(:lat)) * sin(radians(a.latitude)))) < :distancia " +
            "ORDER BY distancia " +
            "LIMIT :pageSize OFFSET :offset",
            nativeQuery = true)
    List<Atividade> findAtividadesProximasPaginado(
            @Param("lat") Double latitude,
            @Param("lon") Double longitude,
            @Param("distancia") Double distanciaEmKm,
            @Param("pageSize") int pageSize,
            @Param("offset") long offset);

    /**
     * Conta o número total de atividades que atendem ao critério de distância.
     * Essencial para que a paginação funcione.
     */
    @Query(value = "SELECT count(*) FROM atividade a " +
            "WHERE (6371 * acos(cos(radians(:lat)) * cos(radians(a.latitude)) * cos(radians(a.longitude) - radians(:lon)) + sin(radians(:lat)) * sin(radians(a.latitude)))) < :distancia",
            nativeQuery = true)
    long countAtividadesProximas(
            @Param("lat") Double latitude,
            @Param("lon") Double longitude,
            @Param("distancia") Double distanciaEmKm);

    List<Atividade> findAllByCriador(User criador);
}
