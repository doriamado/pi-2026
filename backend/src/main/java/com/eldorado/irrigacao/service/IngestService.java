package com.eldorado.irrigacao.service;

import java.time.Clock;
import java.time.OffsetDateTime;

import org.springframework.stereotype.Service;

import com.eldorado.irrigacao.config.IrrigacaoProperties;
import com.eldorado.irrigacao.domain.Device;
import com.eldorado.irrigacao.repository.AlertRepository;
import com.eldorado.irrigacao.repository.DeviceRepository;
import com.eldorado.irrigacao.repository.ReadingRepository;
import com.eldorado.irrigacao.web.ApiException;

/**
 * Recebe uma leitura de um dispositivo (de um Arduino real ou do simulador), grava o histórico,
 * atualiza o "último valor" do dispositivo e mantém os alertas de limite (umidade/água) em dia.
 */
@Service
public class IngestService {

    private final DeviceRepository devices;
    private final ReadingRepository readings;
    private final AlertRepository alerts;
    private final IrrigacaoProperties props;
    private final Clock clock;

    public IngestService(DeviceRepository devices, ReadingRepository readings, AlertRepository alerts,
            IrrigacaoProperties props, Clock clock) {
        this.devices = devices;
        this.readings = readings;
        this.alerts = alerts;
        this.props = props;
        this.clock = clock;
    }

    public void ingest(String deviceId, double moisture, double temperature, double water) {
        Device device = devices.findById(deviceId)
                .orElseThrow(() -> ApiException.notFound("Dispositivo '" + deviceId + "' não encontrado."));

        OffsetDateTime now = OffsetDateTime.now(clock);
        readings.insert(deviceId, moisture, temperature, water, now);
        devices.applyReading(deviceId, moisture, temperature, water, now);

        applyThresholdAlert(device, "LOW_MOISTURE", "high", moisture < device.minMoisture(),
                "Umidade abaixo do limite",
                "A umidade atingiu %.0f%%, abaixo do limite configurado de %d%%.".formatted(moisture, device.minMoisture()));

        applyThresholdAlert(device, "LOW_WATER", "medium", water < props.limites().aguaBaixaPercentual(),
                "Nível de água reduzido",
                "O reservatório está com apenas %.0f%% da capacidade.".formatted(water));

        // Se dados chegaram, o dispositivo voltou a ficar online: fecha um alerta de desconexão em aberto.
        alerts.resolveActive(deviceId, "OFFLINE");
    }

    private void applyThresholdAlert(Device device, String kind, String level, boolean breached, String title, String message) {
        if (breached) {
            if (!alerts.hasActive(device.id(), kind)) {
                alerts.insert(device.id(), kind, level, title, message);
            }
        } else {
            alerts.resolveActive(device.id(), kind);
        }
    }
}
