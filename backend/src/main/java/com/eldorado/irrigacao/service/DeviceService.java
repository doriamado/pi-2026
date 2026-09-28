package com.eldorado.irrigacao.service;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.stereotype.Service;

import com.eldorado.irrigacao.config.IrrigacaoProperties;
import com.eldorado.irrigacao.domain.Device;
import com.eldorado.irrigacao.domain.ReadingPoint;
import com.eldorado.irrigacao.repository.AlertRepository;
import com.eldorado.irrigacao.repository.DeviceRepository;
import com.eldorado.irrigacao.repository.ReadingRepository;
import com.eldorado.irrigacao.web.ApiException;
import com.eldorado.irrigacao.web.dto.CreateDeviceRequest;
import com.eldorado.irrigacao.web.dto.DeviceDetailDto;
import com.eldorado.irrigacao.web.dto.DeviceSettingsRequest;
import com.eldorado.irrigacao.web.dto.DeviceSummaryDto;
import com.eldorado.irrigacao.web.dto.SeriesPointDto;

@Service
public class DeviceService {

    private final DeviceRepository devices;
    private final ReadingRepository readings;
    private final AlertRepository alerts;
    private final DeviceStatusResolver statusResolver;
    private final Clock clock;

    public DeviceService(DeviceRepository devices, ReadingRepository readings, AlertRepository alerts,
            DeviceStatusResolver statusResolver, IrrigacaoProperties props, Clock clock) {
        this.devices = devices;
        this.readings = readings;
        this.alerts = alerts;
        this.statusResolver = statusResolver;
        this.clock = clock;
    }

    public List<DeviceSummaryDto> listSummaries() {
        return devices.findAll().stream().map(this::toSummary).toList();
    }

    public DeviceDetailDto getDetail(String id, int days) {
        Device device = devices.findById(id).orElseThrow(() -> ApiException.notFound("Dispositivo não encontrado."));
        int bucketMinutes = days <= 1 ? 60 : 360; // 24h -> baldes de 1h; 7 dias -> baldes de 6h
        OffsetDateTime since = OffsetDateTime.now(clock).minusDays(days);
        List<SeriesPointDto> series = readings.seriesForDevice(id, since, bucketMinutes).stream()
                .map(this::toSeriesPoint).toList();
        return toDetail(device, series);
    }

    public DeviceSummaryDto create(CreateDeviceRequest req) {
        String id = req.id().trim().toUpperCase();
        if (devices.existsById(id)) {
            throw ApiException.conflict("Já existe um dispositivo cadastrado com o código '" + id + "'.");
        }
        Device toInsert = new Device(id, req.name().trim(), req.location() == null ? "" : req.location().trim(),
                req.type(), null, null, null, null, "v2.4.1", "Wi-Fi", null, java.time.LocalDate.now(clock),
                40, 15, true, true, java.time.LocalTime.of(18, 0), null, null, 0);
        devices.insert(toInsert);
        return toSummary(devices.findById(id).orElseThrow());
    }

    public DeviceDetailDto updateSettings(String id, DeviceSettingsRequest req) {
        ensureExists(id);
        devices.updateSettings(id, req.minMoisture(), req.defaultDurationMin(), req.autoIrrigation(), req.disconnectAlerts());
        return getDetail(id, 1);
    }

    public DeviceDetailDto startIrrigation(String id, Integer minutesOverride) {
        Device device = devices.findById(id).orElseThrow(() -> ApiException.notFound("Dispositivo não encontrado."));
        int minutes = minutesOverride != null && minutesOverride > 0 ? minutesOverride : device.defaultDurationMin();
        if (device.water() != null && device.water() < 10) {
            throw ApiException.badRequest("Nível de água insuficiente para iniciar a irrigação.");
        }
        devices.startIrrigation(id, OffsetDateTime.now(clock).plusMinutes(minutes), "manual", minutes);
        return getDetail(id, 1);
    }

    public DeviceDetailDto stopIrrigation(String id) {
        ensureExists(id);
        devices.stopIrrigation(id);
        return getDetail(id, 1);
    }

    private void ensureExists(String id) {
        if (!devices.existsById(id)) {
            throw ApiException.notFound("Dispositivo não encontrado.");
        }
    }

    private DeviceSummaryDto toSummary(Device d) {
        return new DeviceSummaryDto(d.id(), d.name(), d.location(), d.type(),
                statusResolver.resolve(d).wireValue, d.moisture(), d.temperature(), d.water(),
                d.lastSeenAt() == null ? null : d.lastSeenAt().toString());
    }

    private DeviceDetailDto toDetail(Device d, List<SeriesPointDto> series) {
        boolean irrigating = d.irrigatingAt(OffsetDateTime.now(clock));
        return new DeviceDetailDto(d.id(), d.name(), d.location(), d.type(),
                statusResolver.resolve(d).wireValue, d.moisture(), d.temperature(), d.water(),
                d.lastSeenAt() == null ? null : d.lastSeenAt().toString(),
                d.firmware(), d.connectivity(),
                d.installedAt() == null ? null : d.installedAt().format(DateTimeFormatter.ISO_LOCAL_DATE),
                d.minMoisture(), d.defaultDurationMin(), d.autoIrrigation(), d.disconnectAlerts(),
                d.scheduleTime() == null ? null : d.scheduleTime().toString(),
                irrigating, irrigating ? d.irrigationMinutes() : 0, irrigating ? d.irrigationMode() : null,
                series);
    }

    private SeriesPointDto toSeriesPoint(ReadingPoint p) {
        return new SeriesPointDto(p.t().toString(), p.moisture(), p.temperature(), p.water());
    }
}
