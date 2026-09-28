package com.eldorado.irrigacao.service;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.eldorado.irrigacao.domain.Device;
import com.eldorado.irrigacao.repository.AlertRepository;
import com.eldorado.irrigacao.repository.DeviceRepository;
import com.eldorado.irrigacao.repository.ReadingRepository;
import com.eldorado.irrigacao.repository.SettingsRepository;
import com.eldorado.irrigacao.web.dto.AlertDto;
import com.eldorado.irrigacao.web.dto.DashboardResponse;
import com.eldorado.irrigacao.web.dto.DeviceCountsDto;
import com.eldorado.irrigacao.web.dto.DeviceSummaryDto;
import com.eldorado.irrigacao.web.dto.SeriesPointDto;

@Service
public class DashboardService {

    private final DeviceRepository deviceRepo;
    private final ReadingRepository readingRepo;
    private final AlertService alertService;
    private final SettingsRepository settingsRepo;
    private final DeviceService deviceService;
    private final DeviceStatusResolver statusResolver;
    private final Clock clock;

    public DashboardService(DeviceRepository deviceRepo, ReadingRepository readingRepo, AlertService alertService,
            SettingsRepository settingsRepo, DeviceService deviceService, DeviceStatusResolver statusResolver, Clock clock) {
        this.deviceRepo = deviceRepo;
        this.readingRepo = readingRepo;
        this.alertService = alertService;
        this.settingsRepo = settingsRepo;
        this.deviceService = deviceService;
        this.statusResolver = statusResolver;
        this.clock = clock;
    }

    public DashboardResponse build() {
        List<Device> devices = deviceRepo.findAll();
        int online = 0, offline = 0, alerta = 0;
        double moistureSum = 0, waterSum = 0;
        int moistureCount = 0, waterCount = 0;
        for (Device d : devices) {
            switch (statusResolver.resolve(d)) {
                case ONLINE -> online++;
                case OFFLINE -> offline++;
                case ALERTA -> alerta++;
            }
            if (d.moisture() != null) { moistureSum += d.moisture(); moistureCount++; }
            if (d.water() != null) { waterSum += d.water(); waterCount++; }
        }
        Double avgMoisture = moistureCount == 0 ? null : moistureSum / moistureCount;
        Double avgWater = waterCount == 0 ? null : waterSum / waterCount;

        OffsetDateTime now = OffsetDateTime.now(clock);
        List<SeriesPointDto> series = readingRepo.fleetAverageSeries(now.minusHours(24), 60).stream()
                .map(p -> new SeriesPointDto(p.t().toString(), p.moisture(), p.temperature(), p.water())).toList();

        Double delta = null;
        if (avgMoisture != null) {
            Double previousDayAvg = readingRepo.fleetAverageMoistureSince(now.minusHours(48));
            Double last24hAvg = readingRepo.fleetAverageMoistureSince(now.minusHours(24));
            if (previousDayAvg != null && last24hAvg != null && previousDayAvg > 0) {
                delta = last24hAvg - previousDayAvg;
            }
        }

        List<AlertDto> recent = alertService.recent(3);
        List<DeviceSummaryDto> summaries = deviceService.listSummaries();

        return new DashboardResponse(
                settingsRepo.get().fullName().split(" ")[0],
                new DeviceCountsDto(devices.size(), online, offline, alerta),
                avgMoisture, delta, avgWater,
                (int) summaries.stream().filter(s -> "alerta".equals(s.status())).count(),
                alertService.list(true).summary().highPriority(),
                series, recent, summaries);
    }
}
