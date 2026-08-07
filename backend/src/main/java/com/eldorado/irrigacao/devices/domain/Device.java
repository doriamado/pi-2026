package com.eldorado.irrigacao.devices.domain;

import com.eldorado.irrigacao.common.BaseEntity;
import com.eldorado.irrigacao.gateway.GatewaySource;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "devices")
public class Device extends BaseEntity {

    @Column(nullable = false)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeviceType tipo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeviceStatus status = DeviceStatus.DESCONHECIDO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GatewaySource origem;

    private String firmwareVersion;

    private Instant ultimaComunicacao;

    @Column(nullable = false)
    private UUID userId;

    protected Device() { }

    public Device(String nome, DeviceType tipo, GatewaySource origem, UUID userId) {
        this.nome = nome;
        this.tipo = tipo;
        this.origem = origem;
        this.userId = userId;
    }

    public void registrarComunicacao(Instant instante) {
        this.ultimaComunicacao = instante;
        this.status = DeviceStatus.ONLINE;
    }

    public void marcarOffline() {
        this.status = DeviceStatus.OFFLINE;
    }

    public String getNome() { return nome; }
    public DeviceType getTipo() { return tipo; }
    public DeviceStatus getStatus() { return status; }
    public GatewaySource getOrigem() { return origem; }
    public String getFirmwareVersion() { return firmwareVersion; }
    public Instant getUltimaComunicacao() { return ultimaComunicacao; }
    public UUID getUserId() { return userId; }
    public void setFirmwareVersion(String v) { this.firmwareVersion = v; }
}
