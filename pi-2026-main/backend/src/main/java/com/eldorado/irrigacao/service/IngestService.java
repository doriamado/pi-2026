package com.eldorado.irrigacao.service;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.Locale;

import org.springframework.stereotype.Service;

import com.eldorado.irrigacao.config.IrrigacaoProperties;
import com.eldorado.irrigacao.domain.Device;
import com.eldorado.irrigacao.repository.AlertRepository;
import com.eldorado.irrigacao.repository.DeviceRepository;
import com.eldorado.irrigacao.repository.ReadingRepository;
import com.eldorado.irrigacao.web.ApiException;

/**
 * Recebe uma leitura de um dispositivo (de um Arduino real ou do simulador), grava o histórico,
 * atualiza o "último valor" do dispositivo e mantém os alertas de limite (umidade/água/pH) em dia.
 */
@Service
public class IngestService {

    private static final Locale PT_BR = Locale.forLanguageTag("pt-BR");

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

    /** O pH é opcional (null quando o Arduino não tem sonda de pH). */
    public void ingest(String deviceId, double moisture, double temperature, double water, Double ph) {
        Device device = devices.findById(deviceId)
                .orElseThrow(() -> ApiException.notFound("Dispositivo '" + deviceId + "' não encontrado."));

        OffsetDateTime now = OffsetDateTime.now(clock);
        readings.insert(deviceId, moisture, temperature, water, ph, now);
        devices.applyReading(deviceId, moisture, temperature, water, ph, now);

        applyThresholdAlert(device, "LOW_MOISTURE", "high", moisture < device.minMoisture(),
                "Umidade abaixo do limite",
                "A umidade atingiu %.0f%%, abaixo do limite configurado de %d%%.".formatted(moisture, device.minMoisture()));

        applyThresholdAlert(device, "LOW_WATER", "medium", water < props.limites().aguaBaixaPercentual(),
                "Nível de água reduzido",
                "O reservatório está com apenas %.0f%% da capacidade.".formatted(water));

        if (ph != null) {
            boolean below = ph < device.minPh();
            boolean above = ph > device.maxPh();
            applyThresholdAlert(device, "PH_OUT_OF_RANGE", "medium", below || above,
                    below ? "pH do solo abaixo da faixa" : "pH do solo acima da faixa",
                    "O pH atingiu %s, fora da faixa ideal de %s a %s."
                            .formatted(fmt(ph), fmt(device.minPh()), fmt(device.maxPh())));
        }

        // Se dados chegaram, o dispositivo voltou a ficar online: fecha um alerta de desconexão em aberto.
        alerts.resolveActive(deviceId, "OFFLINE");
    }

    private static String fmt(double v) {
        return String.format(PT_BR, "%.1f", v);
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
