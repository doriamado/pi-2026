package com.eldorado.irrigacao.readings.api;

import com.eldorado.irrigacao.gateway.GatewaySource;
import com.eldorado.irrigacao.readings.application.ReadingService;
import com.eldorado.irrigacao.readings.domain.Reading;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/readings")
public class ReadingController {

    private final ReadingService readingService;

    public ReadingController(ReadingService readingService) {
        this.readingService = readingService;
    }

    @PostMapping
    public Reading registrar(@RequestBody Map<String, String> body) {
        return readingService.registrar(
                UUID.fromString(body.get("sensorId")),
                UUID.fromString(body.get("deviceId")),
                new BigDecimal(body.get("valor")),
                body.get("unidade"),
                GatewaySource.valueOf(body.get("origem"))
        );
    }

    @GetMapping
    public List<Reading> porSensor(@RequestParam UUID sensorId,
                                    @RequestParam Instant inicio,
                                    @RequestParam Instant fim) {
        return readingService.historicoPorSensor(sensorId, inicio, fim);
    }

    @GetMapping("/history")
    public List<Reading> porDevice(@RequestParam UUID deviceId,
                                    @RequestParam Instant inicio,
                                    @RequestParam Instant fim) {
        return readingService.historicoPorDevice(deviceId, inicio, fim);
    }
}
