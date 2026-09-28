package com.eldorado.irrigacao.web.dto;

import java.util.List;

public record DeviceDetailDto(
        String id,
        String name,
        String location,
        String type,
        String status,
        Double moisture,
        Double temperature,
        Double water,
        String lastSeenAt,
        String firmware,
        String connectivity,
        String installedAt,
        int minMoisture,
        int defaultDurationMin,
        boolean autoIrrigation,
        boolean disconnectAlerts,
        String scheduleTime,
        boolean irrigating,
        int irrigationMinutes,
        String irrigationMode,
        List<SeriesPointDto> series) {
}
