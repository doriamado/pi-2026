package com.eldorado.irrigacao.alerts.api;

import com.eldorado.irrigacao.alerts.application.AlertService;
import com.eldorado.irrigacao.alerts.domain.Alert;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/alerts")
public class AlertController {

    private final AlertService alertService;

    public AlertController(AlertService alertService) {
        this.alertService = alertService;
    }

    @GetMapping
    public List<Alert> listar(@RequestParam(required = false) UUID deviceId) {
        return deviceId != null ? alertService.listarPorDevice(deviceId) : alertService.listarAbertos();
    }

    @PatchMapping("/{id}/resolver")
    public void resolver(@PathVariable UUID id) {
        alertService.resolver(id);
    }
}
