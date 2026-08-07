package com.eldorado.irrigacao.mock;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Estado interno em memoria de um dispositivo simulado.
 * Permite evoluir gradualmente umidade, temperatura e nivel do reservatorio
 * ao longo do tempo, e simular falhas (perda de conexao, reservatorio vazio).
 */
class MockSensorState {

    final UUID deviceId;
    final UUID sensorUmidadeId;
    final UUID sensorTemperaturaId;
    final UUID sensorReservatorioId;

    BigDecimal umidade = new BigDecimal("55.0");
    BigDecimal temperatura = new BigDecimal("24.0");
    BigDecimal nivelReservatorio = new BigDecimal("80.0");
    boolean conectado = true;

    MockSensorState(UUID deviceId, UUID sensorUmidadeId, UUID sensorTemperaturaId, UUID sensorReservatorioId) {
        this.deviceId = deviceId;
        this.sensorUmidadeId = sensorUmidadeId;
        this.sensorTemperaturaId = sensorTemperaturaId;
        this.sensorReservatorioId = sensorReservatorioId;
    }
}
