package com.eldorado.irrigacao.dashboard.application;

import com.eldorado.irrigacao.alerts.repository.AlertRepository;
import com.eldorado.irrigacao.alerts.domain.AlertStatus;
import com.eldorado.irrigacao.dashboard.dto.DashboardSummaryDTO;
import com.eldorado.irrigacao.devices.domain.DeviceStatus;
import com.eldorado.irrigacao.devices.repository.DeviceRepository;
import com.eldorado.irrigacao.irrigation.domain.IrrigationSessionStatus;
import com.eldorado.irrigacao.irrigation.repository.IrrigationSessionRepository;
import com.eldorado.irrigacao.sensors.repository.SensorRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Resumo agregado do estado atual da plataforma para a tela de Dashboard do frontend.
 * Nao expoe entidades de dominio diretamente; sempre um DTO dedicado.
 */
@Service
public class DashboardService {

    private final DeviceRepository deviceRepository;
    private final SensorRepository sensorRepository;
    private final AlertRepository alertRepository;
    private final IrrigationSessionRepository irrigationSessionRepository;

    public DashboardService(DeviceRepository deviceRepository,
                             SensorRepository sensorRepository,
                             AlertRepository alertRepository,
                             IrrigationSessionRepository irrigationSessionRepository) {
        this.deviceRepository = deviceRepository;
        this.sensorRepository = sensorRepository;
        this.alertRepository = alertRepository;
        this.irrigationSessionRepository = irrigationSessionRepository;
    }

    public DashboardSummaryDTO resumo() {
        long dispositivosAtivos = deviceRepository.findAll().stream()
                .filter(d -> d.getStatus() == DeviceStatus.ONLINE)
                .count();

        long sensoresOnline = sensorRepository.findAll().stream()
                .filter(s -> s.isOnline())
                .count();

        long alertasAbertos = alertRepository.findByStatusOrderByTimestampDesc(AlertStatus.ABERTO).size();

        long irrigacoesEmAndamento = irrigationSessionRepository.findAll().stream()
                .filter(s -> s.getStatus() == IrrigationSessionStatus.EM_ANDAMENTO)
                .count();

        return new DashboardSummaryDTO(dispositivosAtivos, sensoresOnline, irrigacoesEmAndamento,
                alertasAbertos, List.of());
    }
}
