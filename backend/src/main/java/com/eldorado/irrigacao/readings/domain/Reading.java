package com.eldorado.irrigacao.readings.domain;

import com.eldorado.irrigacao.gateway.GatewaySource;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Entidade de telemetria: alto volume, somente insercao (nunca atualizada).
 * Otimizada para consulta por (sensor_id, timestamp) e (device_id, timestamp).
 */
@Entity
@Table(name = "readings")
public class Reading {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID sensorId;

    @Column(nullable = false)
    private UUID deviceId;

    @Column(nullable = false)
    private BigDecimal valor;

    @Column(nullable = false)
    private String unidade;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GatewaySource origem;

    @Column(nullable = false)
    private Instant timestamp;

    protected Reading() { }

    public Reading(UUID sensorId, UUID deviceId, BigDecimal valor, String unidade,
                    GatewaySource origem, Instant timestamp) {
        this.sensorId = sensorId;
        this.deviceId = deviceId;
        this.valor = valor;
        this.unidade = unidade;
        this.origem = origem;
        this.timestamp = timestamp;
    }

    public UUID getId() { return id; }
    public UUID getSensorId() { return sensorId; }
    public UUID getDeviceId() { return deviceId; }
    public BigDecimal getValor() { return valor; }
    public String getUnidade() { return unidade; }
    public GatewaySource getOrigem() { return origem; }
    public Instant getTimestamp() { return timestamp; }
}
