package com.eldorado.irrigacao.automation.domain;

import com.eldorado.irrigacao.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Regra simples de automacao baseada em limiares (v1).
 * Ex.: SE umidadeSolo < limiarUmidade E nivelReservatorio > limiarReservatorio
 *      ENTAO ligar bomba por duracaoSegundos.
 *
 * O motor podera futuramente ser substituido por IA sem alterar a API publica,
 * pois toda a decisao fica encapsulada aqui dentro do dominio.
 */
@Entity
@Table(name = "automation_rules")
public class AutomationRule extends BaseEntity {

    @Column(nullable = false)
    private UUID deviceId;

    @Column(nullable = false)
    private UUID sensorUmidadeId;

    @Column(nullable = false)
    private UUID sensorReservatorioId;

    @Column(nullable = false)
    private UUID atuadorId;

    @Column(nullable = false)
    private BigDecimal limiarUmidadeMinimo;

    @Column(nullable = false)
    private BigDecimal limiarReservatorioMinimo;

    @Column(nullable = false)
    private Integer duracaoSegundos;

    @Column(nullable = false)
    private boolean ativa = true;

    protected AutomationRule() { }

    public AutomationRule(UUID deviceId, UUID sensorUmidadeId, UUID sensorReservatorioId, UUID atuadorId,
                           BigDecimal limiarUmidadeMinimo, BigDecimal limiarReservatorioMinimo,
                           Integer duracaoSegundos) {
        this.deviceId = deviceId;
        this.sensorUmidadeId = sensorUmidadeId;
        this.sensorReservatorioId = sensorReservatorioId;
        this.atuadorId = atuadorId;
        this.limiarUmidadeMinimo = limiarUmidadeMinimo;
        this.limiarReservatorioMinimo = limiarReservatorioMinimo;
        this.duracaoSegundos = duracaoSegundos;
    }

    /** Decide, com base nas leituras atuais, se a regra deve disparar. */
    public boolean deveAcionar(BigDecimal umidadeAtual, BigDecimal nivelReservatorioAtual) {
        return ativa
                && umidadeAtual.compareTo(limiarUmidadeMinimo) < 0
                && nivelReservatorioAtual.compareTo(limiarReservatorioMinimo) > 0;
    }

    public void habilitar() { this.ativa = true; }
    public void desabilitar() { this.ativa = false; }

    public UUID getDeviceId() { return deviceId; }
    public UUID getSensorUmidadeId() { return sensorUmidadeId; }
    public UUID getSensorReservatorioId() { return sensorReservatorioId; }
    public UUID getAtuadorId() { return atuadorId; }
    public BigDecimal getLimiarUmidadeMinimo() { return limiarUmidadeMinimo; }
    public BigDecimal getLimiarReservatorioMinimo() { return limiarReservatorioMinimo; }
    public Integer getDuracaoSegundos() { return duracaoSegundos; }
    public boolean isAtiva() { return ativa; }
}
