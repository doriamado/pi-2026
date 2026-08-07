package com.eldorado.irrigacao.actuators.domain;

import com.eldorado.irrigacao.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "actuators")
public class Actuator extends BaseEntity {

    @Column(nullable = false)
    private UUID deviceId;

    @Column(nullable = false)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ActuatorType tipo;

    @Column(nullable = false)
    private boolean ligado = false;

    protected Actuator() { }

    public Actuator(UUID deviceId, String nome, ActuatorType tipo) {
        this.deviceId = deviceId;
        this.nome = nome;
        this.tipo = tipo;
    }

    public void ligar() { this.ligado = true; }
    public void desligar() { this.ligado = false; }

    public UUID getDeviceId() { return deviceId; }
    public String getNome() { return nome; }
    public ActuatorType getTipo() { return tipo; }
    public boolean isLigado() { return ligado; }
}
