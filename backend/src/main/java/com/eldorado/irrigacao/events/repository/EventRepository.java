package com.eldorado.irrigacao.events.repository;

import com.eldorado.irrigacao.events.domain.Event;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface EventRepository extends JpaRepository<Event, UUID> { }
