package com.eldorado.irrigacao.web.dto;

import java.util.List;

public record DashboardResponse(
        String greetingName,
        DeviceCountsDto deviceCounts,
        Double avgMoisture,
        Double avgMoistureDeltaPercent,
        Double avgWaterLevel,
        int activeAlerts,
        int highPriorityAlerts,
        List<SeriesPointDto> moistureSeries,
        List<AlertDto> recentAlerts,
        List<DeviceSummaryDto> devices) {
}
