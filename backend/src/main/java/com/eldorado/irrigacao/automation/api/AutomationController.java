package com.eldorado.irrigacao.automation.api;

import com.eldorado.irrigacao.automation.application.AutomationRuleService;
import com.eldorado.irrigacao.automation.domain.AutomationRule;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/automation")
public class AutomationController {

    private final AutomationRuleService ruleService;

    public AutomationController(AutomationRuleService ruleService) {
        this.ruleService = ruleService;
    }

    @GetMapping
    public List<AutomationRule> listar() {
        return ruleService.listar();
    }

    @PostMapping
    public AutomationRule criar(@RequestBody Map<String, String> body) {
        return ruleService.criar(
                UUID.fromString(body.get("deviceId")),
                UUID.fromString(body.get("sensorUmidadeId")),
                UUID.fromString(body.get("sensorReservatorioId")),
                UUID.fromString(body.get("atuadorId")),
                new BigDecimal(body.get("limiarUmidadeMinimo")),
                new BigDecimal(body.get("limiarReservatorioMinimo")),
                Integer.valueOf(body.get("duracaoSegundos"))
        );
    }

    @PatchMapping("/{id}")
    public AutomationRule atualizarStatus(@PathVariable UUID id, @RequestBody Map<String, Boolean> body) {
        boolean ativa = Boolean.TRUE.equals(body.get("ativa"));
        return ativa ? ruleService.habilitar(id) : ruleService.desabilitar(id);
    }
}
