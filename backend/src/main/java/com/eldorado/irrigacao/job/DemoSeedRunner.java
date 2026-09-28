package com.eldorado.irrigacao.job;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.eldorado.irrigacao.config.IrrigacaoProperties;
import com.eldorado.irrigacao.domain.Device;
import com.eldorado.irrigacao.repository.AlertRepository;
import com.eldorado.irrigacao.repository.DeviceRepository;
import com.eldorado.irrigacao.repository.ReadingRepository;

/**
 * Popula o banco vazio com os 4 dispositivos de demonstração (mesmos dados que antes viviam
 * hardcoded no front-end) e uma semana de histórico de leituras, para o painel não nascer vazio.
 * Desative com irrigacao.seed.demo=false em produção.
 */
@Component
@Order(1)
public class DemoSeedRunner implements ApplicationRunner {

    private final DeviceRepository devices;
    private final ReadingRepository readings;
    private final AlertRepository alerts;
    private final IrrigacaoProperties props;
    private final Clock clock;

    public DemoSeedRunner(DeviceRepository devices, ReadingRepository readings, AlertRepository alerts,
            IrrigacaoProperties props, Clock clock) {
        this.devices = devices;
        this.readings = readings;
        this.alerts = alerts;
        this.props = props;
        this.clock = clock;
    }

    private record Seed(String id, String name, String location, String type,
            double moisture, double temperature, double water, int minutesSinceLastSeen) {
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!props.seed().demo() || !devices.findAll().isEmpty()) {
            return;
        }

        List<Seed> seeds = List.of(
                new Seed("ARD-IRR-0421", "Horta Norte", "Setor A • Canteiros 1–8", "Irrigador Pro", 68, 24.8, 82, 0),
                new Seed("ARD-IRR-0418", "Estufa de tomates", "Estufa 02", "Irrigador Pro", 29, 31.2, 54, 2),
                new Seed("ARD-IRR-0396", "Pomar Sul", "Talhão C", "Irrigador Mini", 61, 26.4, 76, 4),
                new Seed("ARD-IRR-0312", "Jardim da sede", "Área administrativa", "Irrigador Mini", 44, 23.9, 38, 190));

        OffsetDateTime now = OffsetDateTime.now(clock);
        ThreadLocalRandom rnd = ThreadLocalRandom.current();

        for (Seed s : seeds) {
            Device toInsert = new Device(s.id(), s.name(), s.location(), s.type(), null, null, s.water(), null,
                    "v2.4.1", "Wi-Fi", -52, LocalDate.now(clock).minusMonths(6), 40, 15, true, true,
                    LocalTime.of(18, 0), null, null, 0);
            devices.insert(toInsert);

            // Sete dias de leituras horárias em passeio aleatório, convergindo para o valor "atual" declarado acima.
            double moisture = s.moisture() + rnd.nextDouble(-8, 8);
            double temperature = s.temperature() + rnd.nextDouble(-2, 2);
            double water = Math.min(100, s.water() + rnd.nextDouble(5, 15));
            for (int hoursAgo = 168; hoursAgo >= 1; hoursAgo--) {
                moisture = clamp(moisture + rnd.nextDouble(-3, 3), 15, 95);
                temperature = clamp(temperature + rnd.nextDouble(-0.8, 0.8), 15, 38);
                water = clamp(water - rnd.nextDouble(-0.2, 0.6), 20, 100);
                readings.insert(s.id(), round1(moisture), round1(temperature), round1(water), now.minusHours(hoursAgo));
            }
            OffsetDateTime lastSeenAt = now.minusMinutes(s.minutesSinceLastSeen());
            readings.insert(s.id(), s.moisture(), s.temperature(), s.water(), lastSeenAt);
            devices.applyReading(s.id(), s.moisture(), s.temperature(), s.water(), lastSeenAt);
        }

        seedAlerts(now);
    }

    private void seedAlerts(OffsetDateTime now) {
        alerts.insert("ARD-IRR-0418", "LOW_MOISTURE", "high", "Umidade abaixo do limite",
                "A umidade atingiu 29%, abaixo do limite configurado de 40%.");
        alerts.insert("ARD-IRR-0312", "OFFLINE", "medium", "Dispositivo desconectado",
                "O dispositivo não envia dados há mais de 3 horas.");
        alerts.insert("ARD-IRR-0312", "LOW_WATER", "medium", "Nível de água reduzido",
                "O reservatório está com apenas 38% da capacidade.");

        long doneId = alerts.insert("ARD-IRR-0396", "IRRIGATION_DONE", "low", "Irrigação concluída",
                "O ciclo automático de 15 minutos foi concluído com sucesso.");
        alerts.markRead(doneId);
        alerts.resolveActive("ARD-IRR-0396", "IRRIGATION_DONE");

        long firmwareId = alerts.insert("ARD-IRR-0421", "FIRMWARE", "low", "Firmware atualizado",
                "O dispositivo foi atualizado para a versão 2.4.1.");
        alerts.markRead(firmwareId);
        alerts.resolveActive("ARD-IRR-0421", "FIRMWARE");
    }

    private static double clamp(double v, double min, double max) {
        return Math.max(min, Math.min(max, v));
    }

    private static double round1(double v) {
        return Math.round(v * 10) / 10.0;
    }
}
