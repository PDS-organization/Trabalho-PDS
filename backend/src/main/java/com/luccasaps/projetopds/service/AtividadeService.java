package com.luccasaps.projetopds.service;

import com.luccasaps.projetopds.controller.dto.AtividadeCreateDTO;
import com.luccasaps.projetopds.controller.dto.AtividadeUpdateDTO;
import com.luccasaps.projetopds.controller.mappers.AtividadeMapper;
import com.luccasaps.projetopds.model.Atividade;
import com.luccasaps.projetopds.model.Modalidade;
import com.luccasaps.projetopds.model.StatusAtividade;
import com.luccasaps.projetopds.model.User;
import com.luccasaps.projetopds.repository.AtividadeRepository;
import com.luccasaps.projetopds.repository.UserRepository;
import com.luccasaps.projetopds.repository.ModalidadeRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AtividadeService {

    private final AtividadeRepository atividadeRepository;
    private final UserRepository userRepository;
    private final ModalidadeRepository modalidadeRepository;
    private final AtividadeMapper atividadeMapper;
    private final GeocodingService geocodingService;

    // Exemplo de método para criar uma atividade
    @Transactional // Garante que todas as operações com o banco sejam atômicas
    public Atividade create(AtividadeCreateDTO dto, String criadorUsername) {
        // 1. Busca as entidades relacionadas (Usuário e Modalidade)
        User criador = userRepository.findByUsername(criadorUsername);

        Modalidade modalidade = modalidadeRepository.findByNome(dto.modalidade());

        // 2. Cria e popula a nova instância da entidade Atividade
        Atividade atividade = atividadeMapper.toEntity(dto);
        atividade.setCriador(criador);
        atividade.setModalidade(modalidade);

        // 4. Define valores padrão de negócio
        atividade.setStatus(StatusAtividade.OPEN); // Uma nova atividade sempre começa como "Aberta"
        atividade.getParticipantes().add(criador); // O criador é automaticamente o primeiro participante

        GeocodingService.Coordenadas coords = geocodingService.getCoordinates(dto.cep());

        if (coords == null) {
            throw new IllegalArgumentException("Não foi possível obter as coordenadas para o CEP informado. A atividade não pode ser criada.");
        }

        atividade.setLatitude(coords.latitude());
        atividade.setLongitude(coords.longitude());

        // 5. Salva a nova atividade no banco de dados
        return atividadeRepository.save(atividade);
    }

    @Transactional
    public Atividade update(UUID atividadeId, AtividadeUpdateDTO dto, String usernameAtual) {
        // 1. Busca a atividade no banco de dados.
        Atividade atividade = atividadeRepository.findById(atividadeId)
                .orElseThrow(() -> new EntityNotFoundException("Atividade não encontrada com o ID: " + atividadeId));

        // 2. !! VERIFICAÇÃO DE SEGURANÇA CRUCIAL !!
        // Garante que o usuário que está fazendo a requisição é o mesmo que criou a atividade.
        if (!atividade.getCriador().getUsername().equals(usernameAtual)) {
            throw new AccessDeniedException("Acesso negado: você não tem permissão para alterar esta atividade.");
        }

        // 3. Aplica as atualizações dos campos que foram fornecidos no DTO
        atividadeMapper.updateAtividadeFromDto(dto, atividade);

        // 4. O @Transactional se encarrega de salvar a entidade atualizada no banco.
        return atividade;
    }

    @Transactional(readOnly = true)
    public Page<Atividade> findNearbyPaginated(String cep, Double distanciaKm, Pageable pageable) {

        // 1. Converte o CEP em coordenadas usando o serviço atualizado
        GeocodingService.Coordenadas coords = geocodingService.getCoordinates(cep);

        // 2. A verificação de nulo agora é mais simples
        if (coords == null) {
            throw new EntityNotFoundException("CEP inválido ou não foi possível encontrar coordenadas: " + cep);
        }

        // 3. Extrai a latitude e longitude do nosso record padronizado
        Double latitude = coords.latitude();
        Double longitude = coords.longitude();

        // Busca a lista de atividades para a página atual
        List<Atividade> atividadesDaPagina = atividadeRepository.findAtividadesProximasPaginado(
                latitude,
                longitude,
                distanciaKm,
                pageable.getPageSize(),
                pageable.getOffset()
        );

        // Busca o número total de atividades que correspondem à busca
        long totalDeAtividades = atividadeRepository.countAtividadesProximas(latitude, longitude, distanciaKm);

        // Cria e retorna um objeto Page
        return new PageImpl<>(atividadesDaPagina, pageable, totalDeAtividades);
    }

    @Transactional(readOnly = true)
    public Page<Atividade> findAllPaginated(Pageable pageable) {
        return atividadeRepository.findAll(pageable);
    }

    @Transactional
    public void inscrever(UUID atividadeId, String username) {
        // 1. Busca a atividade e o usuário no banco de dados.
        Atividade atividade = atividadeRepository.findById(atividadeId)
                .orElseThrow(() -> new EntityNotFoundException("Atividade não encontrada com o ID: " + atividadeId));

        User usuario = userRepository.findOptionalByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + username));

        // 2. --- Validações de Regra de Negócio ---

        // Validação 1: A atividade deve estar aberta para inscrições.
        if (atividade.getStatus() != StatusAtividade.OPEN) {
            throw new IllegalStateException("Esta atividade não está aberta para inscrições.");
        }

        // Validação 2: O usuário não pode se inscrever em uma atividade que ele já participa.
        if (atividade.getParticipantes().contains(usuario)) {
            throw new IllegalStateException("Você já está inscrito nesta atividade.");
        }

        // Validação 3: Se a atividade não tem limite de vagas, permite a inscrição.
        // Se tiver limite, verifica se ainda há vagas.
        if (!atividade.isSemLimite() && atividade.getParticipantes().size() >= atividade.getCapacidade()) {
            throw new IllegalStateException("Esta atividade já atingiu a capacidade máxima de participantes.");
        }

        // 3. --- Processa a Inscrição ---
        atividade.getParticipantes().add(usuario);

        // 4. Se a atividade atingiu a capacidade máxima após a inscrição, fecha para novas inscrições.
        if (!atividade.isSemLimite() && atividade.getParticipantes().size() == atividade.getCapacidade()) {
            atividade.setStatus(StatusAtividade.CLOSED);
        }
    }

    @Transactional
    public void deleteById(UUID atividadeId, String username) {
        // 1. Busca a atividade no banco de dados.
        Atividade atividade = atividadeRepository.findById(atividadeId)
                .orElseThrow(() -> new EntityNotFoundException("Atividade não encontrada com o ID: " + atividadeId));

        // 2. !! VERIFICAÇÃO DE SEGURANÇA CRUCIAL !!
        // Garante que o usuário que está fazendo a requisição é o mesmo que criou a atividade.
        if (!atividade.getCriador().getUsername().equals(username)) {
            throw new AccessDeniedException("Acesso negado: você não tem permissão para excluir esta atividade.");
        }

        // 3. Se a verificação passar, exclui a atividade.
        // O JPA cuidará de remover os registros na tabela de junção 'atividade_participantes'.
        atividadeRepository.delete(atividade);
    }
}