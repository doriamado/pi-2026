package com.eldorado.irrigacao.job;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.eldorado.irrigacao.domain.Device;
import com.eldorado.irrigacao.repository.AlertRepository;
import com.eldorado.irrigacao.repository.DeviceRepository;

/** A cada 15s, encerra irrigações cujo tempo programado já passou e registra a conclusão como alerta informativo. */
@Component
public class IrrigationScheduler {

    private final DeviceRepository devices;
    private final AlertRepository alerts;
    private final Clock clock;

    public IrrigationScheduler(DeviceRepository devices, AlertRepository alerts, Clock clock) {
        this.devices = devices;
        this.alerts = alerts;
        this.clock = clock;
    }

    @Scheduled(fixedDelay = 15_000)
    public void stopFinishedIrrigations() {
        OffsetDateTime now = OffsetDateTime.now(clock);
        List<Device> finished = devices.findWithIrrigationEndingBefore(now);
        for (Device d : finished) {
            devices.stopIrrigation(d.id());
            alerts.insert(d.id(), "IRRIGATION_DONE", "low", "Irrigação concluída",
                    "O ciclo de %d minutos foi concluído com sucesso.".formatted(d.irrigationMinutes()));
        }
    }
}
