package com.eldorado.irrigacao.domain;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;

public record Device(
        String id,
        String name,
        String location,
        String type,
        Double moisture,
        Double temperature,
        Double water,
        OffsetDateTime lastSeenAt,
        String firmware,
        String connectivity,
        Integer rssi,
        LocalDate installedAt,
        int minMoisture,
        int defaultDurationMin,
        boolean autoIrrigation,
        boolean disconnectAlerts,
        LocalTime scheduleTime,
        OffsetDateTime irrigatingUntil,
        String irrigationMode,
        int irrigationMinutes) {

    public boolean irrigatingAt(OffsetDateTime now) {
        return irrigatingUntil != null && irrigatingUntil.isAfter(now);
    }
}
