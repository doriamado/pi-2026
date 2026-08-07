package com.eldorado.irrigacao.sensors.api;

import com.eldorado.irrigacao.sensors.application.SensorService;
import com.eldorado.irrigacao.sensors.domain.Sensor;
import com.eldorado.irrigacao.sensors.domain.SensorType;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/sensors")
public class SensorController {

    private final SensorService sensorService;

    public SensorController(SensorService sensorService) {
        this.sensorService = sensorService;
    }

    @GetMapping
    public List<Sensor> listar(@RequestParam(required = false) UUID deviceId) {
        return deviceId != null ? sensorService.listarPorDevice(deviceId) : sensorService.listar();
    }

    @GetMapping("/{id}")
    public Sensor buscar(@PathVariable UUID id) {
        return sensorService.buscar(id);
    }

    @PostMapping
    public Sensor criar(@RequestBody Map<String, String> body) {
        return sensorService.criar(
                UUID.fromString(body.get("deviceId")),
                body.get("nome"),
                SensorType.valueOf(body.get("tipo"))
        );
    }
}
