package com.eldorado.irrigacao.gateway;

/**
 * Origem de um dado recebido pelo Device Gateway.
 * O restante da aplicacao nunca decide comportamento com base nisso;
 * serve apenas para rastreabilidade/auditoria dos dados.
 */
public enum GatewaySource {
    MOCK,
    REAL
}
