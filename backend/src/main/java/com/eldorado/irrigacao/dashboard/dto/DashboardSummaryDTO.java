package com.eldorado.irrigacao.dashboard.dto;

import java.util.List;

public record DashboardSummaryDTO(
        long dispositivosAtivos,
        long sensoresOnline,
        long irrigacoesEmAndamento,
        long alertasAbertos,
        List<UltimaLeituraDTO> ultimasLeituras
) {
    public record UltimaLeituraDTO(String sensorNome, String valor, String unidade) { }
}
