package com.eldorado.irrigacao.gateway;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Abstracao unica de entrada/saida de dados de dispositivos.
 *
 * A aplicacao (services, dominio) so conhece esta interface. Nunca sabe se
 * o dado veio do Mock Gateway, de um ESP32 via HTTP, de MQTT ou de LoRa.
 *
 * Implementacoes atuais: MockGatewayService (obrigatoria, sempre ativa).
 * Implementacoes futuras: Esp32HttpGateway, MqttGateway, LoRaGateway.
 */
public interface DeviceGateway {

    GatewaySource getSource();

    /**
     * Envia um comando para um atuador (ex: ligar bomba por N segundos).
     */
    void sendCommand(UUID deviceId, UUID actuatorId, String command, BigDecimal durationSeconds);
}
