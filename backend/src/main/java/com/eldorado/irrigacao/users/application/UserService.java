package com.eldorado.irrigacao.users.application;

import com.eldorado.irrigacao.users.domain.User;
import com.eldorado.irrigacao.users.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<User> listar() {
        return userRepository.findAll();
    }

    public User criar(String nome, String email) {
        return userRepository.save(new User(nome, email));
    }

    public User atualizar(UUID id, String nome, String email) {
        User user = buscar(id);
        user.atualizarDados(nome, email);
        return userRepository.save(user);
    }

    public User buscar(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario nao encontrado: " + id));
    }
}
