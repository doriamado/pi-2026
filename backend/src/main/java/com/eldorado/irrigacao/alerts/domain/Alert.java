package com.eldorado.irrigacao.alerts.domain;

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

@Entity
@Table(name = "alerts")
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID deviceId;

    @Column(nullable = false)
    private String origem;

    @Column(nullable = false)
    private String mensagem;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AlertSeverity severidade;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AlertStatus status = AlertStatus.ABERTO;

    @Column(nullable = false)
    private Instant timestamp;

    protected Alert() { }

    public Alert(UUID deviceId, String origem, String mensagem, AlertSeverity severidade, Instant timestamp) {
        this.deviceId = deviceId;
        this.origem = origem;
        this.mensagem = mensagem;
        this.severidade = severidade;
        this.timestamp = timestamp;
    }

    public void resolver() { this.status = AlertStatus.RESOLVIDO; }

    public UUID getId() { return id; }
    public UUID getDeviceId() { return deviceId; }
    public String getOrigem() { return origem; }
    public String getMensagem() { return mensagem; }
    public AlertSeverity getSeveridade() { return severidade; }
    public AlertStatus getStatus() { return status; }
    public Instant getTimestamp() { return timestamp; }
}
