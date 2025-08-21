package com.luccasaps.projetopds.service;

import com.luccasaps.projetopds.model.Modalidade;
import com.luccasaps.projetopds.model.User;
import com.luccasaps.projetopds.repository.ModalidadeRepository;
import com.luccasaps.projetopds.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor // Cria um construtor com os campos 'final' para injeção de dependência
public class ModalidadeService {

    private final UserRepository userRepository;
    private final ModalidadeRepository modalidadeRepository;

    @Transactional // Garante que toda a operação ocorra em uma única transação
    public void atribuirModalidades(UUID usuarioId, List<String> modalidadesNomes) {
        // 1. Busca o usuário no banco de dados. Lança uma exceção se não encontrar.
        // O seu ID de usuário é UUID, então usamos isso.
        User user = userRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado com o ID: " + usuarioId));

        // 2. Limpa a lista de modalidades atual do usuário para garantir a substituição completa.
        user.getModalidades().clear();

        // 3. Se a lista de nomes não for vazia, busca as modalidades correspondentes.
        if (modalidadesNomes != null && !modalidadesNomes.isEmpty()) {
            List<Modalidade> modalidadesEncontradas = modalidadeRepository.findByNomeIn(modalidadesNomes);

            // Validação importante: verifica se todas as modalidades enviadas existem no banco
            if (modalidadesEncontradas.size() != modalidadesNomes.size()) {
                throw new EntityNotFoundException("Uma ou mais modalidades informadas não existem no sistema.");
            }

            // 4. Adiciona as modalidades encontradas ao usuário.
            user.setModalidades(new HashSet<>(modalidadesEncontradas));
        }

        // 5. Salva o usuário. O JPA/Hibernate se encarregará de atualizar a tabela de junção 'user_modalidade'.
        userRepository.save(user);
    }

    public List<Modalidade> findAll(){
        return modalidadeRepository.findAll();
    }
}