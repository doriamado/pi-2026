package com.eldorado.irrigacao.devices.api;

import com.eldorado.irrigacao.devices.application.DeviceService;
import com.eldorado.irrigacao.devices.domain.Device;
import com.eldorado.irrigacao.devices.domain.DeviceType;
import com.eldorado.irrigacao.gateway.GatewaySource;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/devices")
public class DeviceController {

    private final DeviceService deviceService;

    public DeviceController(DeviceService deviceService) {
        this.deviceService = deviceService;
    }

    @GetMapping
    public List<Device> listar() {
        return deviceService.listar();
    }

    @GetMapping("/{id}")
    public Device buscar(@PathVariable UUID id) {
        return deviceService.buscar(id);
    }

    @PostMapping
    public Device criar(@RequestBody Map<String, String> body) {
        return deviceService.criar(
                body.get("nome"),
                DeviceType.valueOf(body.get("tipo")),
                GatewaySource.valueOf(body.get("origem")),
                UUID.fromString(body.get("userId"))
        );
    }

    @DeleteMapping("/{id}")
    public void remover(@PathVariable UUID id) {
        deviceService.remover(id);
    }
}
