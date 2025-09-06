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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AtividadeService {

    private final AtividadeRepository atividadeRepository;
    private final UserRepository userRepository;
    private final ModalidadeRepository modalidadeRepository;
    private final AtividadeMapper atividadeMapper;

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
}