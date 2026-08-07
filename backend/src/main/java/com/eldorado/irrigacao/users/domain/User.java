package com.eldorado.irrigacao.users.domain;

import com.eldorado.irrigacao.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

/**
 * Sem autenticacao na v1: User existe apenas como dono/gerenciador
 * de dispositivos (nao ha login, senha ou sessao).
 */
@Entity
@Table(name = "users")
public class User extends BaseEntity {

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false, unique = true)
    private String email;

    protected User() { }

    public User(String nome, String email) {
        this.nome = nome;
        this.email = email;
    }

    public String getNome() { return nome; }
    public String getEmail() { return email; }

    public void atualizarDados(String nome, String email) {
        this.nome = nome;
        this.email = email;
    }
}
