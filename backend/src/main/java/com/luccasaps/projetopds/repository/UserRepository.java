package com.luccasaps.projetopds.repository;

import com.luccasaps.projetopds.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    User findByUsername(String username);

    Optional<User> findOptionalByUsername(String username);

    Optional<User> findByEmail(String email);
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByUsernameIgnoreCase(String username);
    // carrega o usuário + modalidades em uma única query
    @Query("""
           select u from User u
           left join fetch u.modalidades m
           where upper(u.email) = upper(:email)
           """)
    Optional<User> findByEmailIgnoreCaseFetchModalidades(@Param("email") String email);
}
