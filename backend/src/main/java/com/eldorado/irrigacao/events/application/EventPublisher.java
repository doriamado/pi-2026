package com.eldorado.irrigacao.events.application;

import com.eldorado.irrigacao.events.domain.Event;
import com.eldorado.irrigacao.events.domain.EventType;
import com.eldorado.irrigacao.events.repository.EventRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

/**
 * Ponto unico de registro de eventos do sistema.
 * Qualquer modulo que precise registrar um evento relevante usa este service.
 */
@Service
public class EventPublisher {

    private final EventRepository eventRepository;

    public EventPublisher(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    public void publicar(UUID deviceId, EventType tipo, String descricao) {
        eventRepository.save(new Event(deviceId, tipo, descricao, Instant.now()));
    }
}
