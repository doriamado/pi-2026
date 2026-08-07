package com.eldorado.irrigacao.irrigation.api;

import com.eldorado.irrigacao.irrigation.application.IrrigationService;
import com.eldorado.irrigacao.irrigation.domain.IrrigationSession;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/irrigation")
public class IrrigationController {

    private final IrrigationService irrigationService;

    public IrrigationController(IrrigationService irrigationService) {
        this.irrigationService = irrigationService;
    }

    @PostMapping("/start")
    public IrrigationSession start(@RequestBody Map<String, String> body) {
        return irrigationService.iniciar(
                UUID.fromString(body.get("deviceId")),
                UUID.fromString(body.get("atuadorId")),
                null
        );
    }

    @PostMapping("/stop")
    public void stop(@RequestBody Map<String, String> body) {
        irrigationService.encerrar(UUID.fromString(body.get("deviceId")));
    }

    @GetMapping("/status")
    public Optional<IrrigationSession> status(@RequestParam UUID deviceId) {
        return irrigationService.statusAtual(deviceId);
    }
}
