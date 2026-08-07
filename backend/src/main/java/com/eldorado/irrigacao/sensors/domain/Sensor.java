package com.eldorado.irrigacao.sensors.domain;

import com.eldorado.irrigacao.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "sensors")
public class Sensor extends BaseEntity {

    @Column(nullable = false)
    private UUID deviceId;

    @Column(nullable = false)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SensorType tipo;

    @Column(nullable = false)
    private boolean online = true;

    protected Sensor() { }

    public Sensor(UUID deviceId, String nome, SensorType tipo) {
        this.deviceId = deviceId;
        this.nome = nome;
        this.tipo = tipo;
    }

    public void marcarOnline() { this.online = true; }
    public void marcarOffline() { this.online = false; }

    public UUID getDeviceId() { return deviceId; }
    public String getNome() { return nome; }
    public SensorType getTipo() { return tipo; }
    public boolean isOnline() { return online; }
}
