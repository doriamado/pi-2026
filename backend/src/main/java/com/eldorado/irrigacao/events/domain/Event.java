package com.eldorado.irrigacao.events.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

/** Log imutavel de todo evento relevante do sistema. */
@Entity
@Table(name = "events")
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID deviceId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventType tipo;

    @Column(nullable = false)
    private String descricao;

    @Column(nullable = false)
    private Instant timestamp;

    protected Event() { }

    public Event(UUID deviceId, EventType tipo, String descricao, Instant timestamp) {
        this.deviceId = deviceId;
        this.tipo = tipo;
        this.descricao = descricao;
        this.timestamp = timestamp;
    }

    public UUID getId() { return id; }
    public UUID getDeviceId() { return deviceId; }
    public EventType getTipo() { return tipo; }
    public String getDescricao() { return descricao; }
    public Instant getTimestamp() { return timestamp; }
}
