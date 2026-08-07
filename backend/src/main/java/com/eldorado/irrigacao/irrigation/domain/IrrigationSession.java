package com.eldorado.irrigacao.irrigation.domain;

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
@Table(name = "irrigation_sessions")
public class IrrigationSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID deviceId;

    @Column(nullable = false)
    private UUID atuadorId;

    /** Nula quando a sessao foi disparada manualmente. */
    private UUID automationRuleId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IrrigationSessionStatus status = IrrigationSessionStatus.EM_ANDAMENTO;

    @Column(nullable = false)
    private Instant startTime;

    private Instant endTime;

    protected IrrigationSession() { }

    public IrrigationSession(UUID deviceId, UUID atuadorId, UUID automationRuleId, Instant startTime) {
        this.deviceId = deviceId;
        this.atuadorId = atuadorId;
        this.automationRuleId = automationRuleId;
        this.startTime = startTime;
    }

    public void encerrar(Instant endTime) {
        this.status = IrrigationSessionStatus.CONCLUIDA;
        this.endTime = endTime;
    }

    public void marcarFalha(Instant endTime) {
        this.status = IrrigationSessionStatus.FALHA;
        this.endTime = endTime;
    }

    public UUID getId() { return id; }
    public UUID getDeviceId() { return deviceId; }
    public UUID getAtuadorId() { return atuadorId; }
    public UUID getAutomationRuleId() { return automationRuleId; }
    public IrrigationSessionStatus getStatus() { return status; }
    public Instant getStartTime() { return startTime; }
    public Instant getEndTime() { return endTime; }
}
