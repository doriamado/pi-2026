package com.eldorado.irrigacao.users.api;

import com.eldorado.irrigacao.users.application.UserService;
import com.eldorado.irrigacao.users.domain.User;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<User> listar() {
        return userService.listar();
    }

    @PostMapping
    public User criar(@RequestBody Map<String, String> body) {
        return userService.criar(body.get("nome"), body.get("email"));
    }

    @PatchMapping("/{id}")
    public User atualizar(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        return userService.atualizar(id, body.get("nome"), body.get("email"));
    }
}
