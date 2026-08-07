package com.eldorado.irrigacao.users.repository;

import com.eldorado.irrigacao.users.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> { }
