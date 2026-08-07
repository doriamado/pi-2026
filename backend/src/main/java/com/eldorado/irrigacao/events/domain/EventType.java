package com.eldorado.irrigacao.events.domain;

public enum EventType {
    SENSOR_CONECTADO,
    SENSOR_DESCONECTADO,
    LEITURA_RECEBIDA,
    IRRIGACAO_INICIADA,
    IRRIGACAO_ENCERRADA,
    FALHA_COMUNICACAO,
    ALERTA_DISPARADO
}
