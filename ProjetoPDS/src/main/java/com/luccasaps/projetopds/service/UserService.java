package com.luccasaps.projetopds.service;

import com.luccasaps.projetopds.model.User;
import com.luccasaps.projetopds.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;

    public void save(User user){
        var senha = user.getPassword();

        user.setPassword(passwordEncoder.encode(senha));
        userRepository.save(user);
    }

    public User findByUserName(String userName){
        return userRepository.findByUserName(userName);
    }

    public User findByEmail(String email){
        return userRepository.findByEmail(email);
    }
}
