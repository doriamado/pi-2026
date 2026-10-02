package com.eldorado.irrigacao.service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.stereotype.Service;

import com.eldorado.irrigacao.domain.Device;
import com.eldorado.irrigacao.domain.ReadingPoint;
import com.eldorado.irrigacao.domain.Regime;
import com.eldorado.irrigacao.repository.DeviceRepository;
import com.eldorado.irrigacao.repository.ReadingRepository;
import com.eldorado.irrigacao.web.ApiException;
import com.eldorado.irrigacao.web.dto.CreateDeviceRequest;
import com.eldorado.irrigacao.web.dto.DeviceDetailDto;
import com.eldorado.irrigacao.web.dto.DeviceSettingsRequest;
import com.eldorado.irrigacao.web.dto.DeviceSummaryDto;
import com.eldorado.irrigacao.web.dto.SeriesPointDto;
import com.eldorado.irrigacao.web.dto.UpdateDeviceRequest;

@Service
public class DeviceService {

    private static final double DEFAULT_MIN_PH = 5.5;
    private static final double DEFAULT_MAX_PH = 7.0;

    private final DeviceRepository devices;
    private final ReadingRepository readings;
    private final DeviceStatusResolver statusResolver;
    private final IrrigationService irrigation;
    private final ScheduleService scheduleService;
    private final Clock clock;

    public DeviceService(DeviceRepository devices, ReadingRepository readings, DeviceStatusResolver statusResolver,
            IrrigationService irrigation, ScheduleService scheduleService, Clock clock) {
        this.devices = devices;
        this.readings = readings;
        this.statusResolver = statusResolver;
        this.irrigation = irrigation;
        this.scheduleService = scheduleService;
        this.clock = clock;
    }

    public List<DeviceSummaryDto> listSummaries() {
        return devices.findAll().stream().map(this::toSummary).toList();
    }

    /** days: 1 (24 h), 7 ou 30. Cada período usa baldes de tamanho diferente para manter ~24-60 pontos por gráfico. */
    public DeviceDetailDto getDetail(String id, int days) {
        Device device = find(id);
        int period = days <= 1 ? 1 : days <= 7 ? 7 : 30;
        int bucketMinutes = switch (period) {
            case 1 -> 60;
            case 7 -> 180;
            default -> 720;
        };
        OffsetDateTime since = OffsetDateTime.now(clock).minusDays(period);
        List<SeriesPointDto> series = readings.seriesForDevice(id, since, bucketMinutes).stream()
                .map(this::toSeriesPoint).toList();
        return toDetail(device, series);
    }

    public DeviceSummaryDto create(CreateDeviceRequest req) {
        String id = req.id().trim().toUpperCase();
        if (devices.existsById(id)) {
            throw ApiException.conflict("Já existe um dispositivo cadastrado com o código '" + id + "'.");
        }
        double minPh = req.minPh() == null ? DEFAULT_MIN_PH : req.minPh();
        double maxPh = req.maxPh() == null ? DEFAULT_MAX_PH : req.maxPh();
        validatePhRange(minPh, maxPh);
        Regime regime = irrigation.resolveRegime(req.defaultRegime(), Regime.MODERADA.key);

        Device toInsert = new Device(id, req.name().trim(), clean(req.location()), req.type(),
                null, null, null, null, null,
                "v2.4.1", blankTo(req.connectivity(), "Wi-Fi"), null, LocalDate.now(clock),
                req.minMoisture() == null ? 40 : req.minMoisture(),
                req.defaultDurationMin() == null ? 15 : req.defaultDurationMin(),
                req.autoIrrigation() == null || req.autoIrrigation(),
                req.disconnectAlerts() == null || req.disconnectAlerts(),
                LocalTime.of(18, 0), null, null, 0,
                clean(req.crop()), minPh, maxPh, regime.key, null);
        devices.insert(toInsert);
        return toSummary(find(id));
    }

    public DeviceDetailDto updateProfile(String id, UpdateDeviceRequest req) {
        find(id);
        devices.updateProfile(id, req.name().trim(), req.type(), clean(req.location()), clean(req.crop()),
                blankTo(req.connectivity(), "Wi-Fi"));
        return getDetail(id, 1);
    }

    public void delete(String id) {
        find(id);
        devices.delete(id);
    }

    public DeviceDetailDto updateSettings(String id, DeviceSettingsRequest req) {
        Device current = find(id);
        double minPh = req.minPh() == null ? current.minPh() : req.minPh();
        double maxPh = req.maxPh() == null ? current.maxPh() : req.maxPh();
        validatePhRange(minPh, maxPh);
        Regime regime = irrigation.resolveRegime(req.defaultRegime(), current.defaultRegime());
        devices.updateSettings(id, req.minMoisture(), req.defaultDurationMin(), req.autoIrrigation(),
                req.disconnectAlerts(), minPh, maxPh, regime.key);
        return getDetail(id, 1);
    }

    public DeviceDetailDto startIrrigation(String id, Integer minutesOverride, String regimeOverride) {
        Device device = find(id);
        int minutes = minutesOverride != null && minutesOverride > 0 ? minutesOverride : device.defaultDurationMin();
        if (minutes > 240) {
            throw ApiException.badRequest("A duração máxima de uma irrigação é de 240 minutos.");
        }
        Regime regime = irrigation.resolveRegime(regimeOverride, device.defaultRegime());
        irrigation.start(device, minutes, regime, "manual", null);
        return getDetail(id, 1);
    }

    public DeviceDetailDto stopIrrigation(String id) {
        find(id);
        irrigation.stop(id);
        return getDetail(id, 1);
    }

    private Device find(String id) {
        return devices.findById(id).orElseThrow(() -> ApiException.notFound("Dispositivo não encontrado."));
    }

    private static void validatePhRange(double minPh, double maxPh) {
        if (minPh < 0 || maxPh > 14 || minPh >= maxPh) {
            throw ApiException.badRequest("Faixa de pH inválida: o mínimo deve ser menor que o máximo (entre 0 e 14).");
        }
    }

    private static String clean(String s) {
        return s == null ? "" : s.trim();
    }

    private static String blankTo(String s, String fallback) {
        return s == null || s.isBlank() ? fallback : s.trim();
    }

    private DeviceSummaryDto toSummary(Device d) {
        return new DeviceSummaryDto(d.id(), d.name(), d.location(), d.type(),
                statusResolver.resolve(d).wireValue, d.moisture(), d.temperature(), d.water(), d.ph(), d.crop(),
                d.irrigatingAt(OffsetDateTime.now(clock)),
                d.lastSeenAt() == null ? null : d.lastSeenAt().toString());
    }

    private DeviceDetailDto toDetail(Device d, List<SeriesPointDto> series) {
        OffsetDateTime now = OffsetDateTime.now(clock);
        boolean irrigating = d.irrigatingAt(now);
        return new DeviceDetailDto(d.id(), d.name(), d.location(), d.type(),
                statusResolver.resolve(d).wireValue, d.moisture(), d.temperature(), d.water(), d.ph(),
                d.lastSeenAt() == null ? null : d.lastSeenAt().toString(),
                d.firmware(), d.connectivity(),
                d.installedAt() == null ? null : d.installedAt().format(DateTimeFormatter.ISO_LOCAL_DATE),
                d.crop(), d.minMoisture(), d.minPh(), d.maxPh(), d.defaultDurationMin(), d.defaultRegime(),
                d.autoIrrigation(), d.disconnectAlerts(),
                d.scheduleTime() == null ? null : d.scheduleTime().toString(),
                irrigating, irrigating ? d.irrigationMinutes() : 0, irrigating ? d.irrigationMode() : null,
                irrigating ? d.irrigationRegime() : null,
                irrigating ? d.irrigatingUntil().toString() : null,
                series, scheduleService.listForDevice(d.id()), irrigation.historyForDevice(d.id(), 8));
    }

    private SeriesPointDto toSeriesPoint(ReadingPoint p) {
        return new SeriesPointDto(p.t().toString(), p.moisture(), p.temperature(), p.water(), p.ph());
    }
}
