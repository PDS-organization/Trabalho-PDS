package com.luccasaps.projetopds.repository;

import com.luccasaps.projetopds.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    User findByUserName(String username);

    User findByEmail(String email);
}
