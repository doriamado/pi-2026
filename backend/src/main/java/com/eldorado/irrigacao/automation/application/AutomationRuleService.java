package com.eldorado.irrigacao.automation.application;

import com.eldorado.irrigacao.automation.domain.AutomationRule;
import com.eldorado.irrigacao.automation.repository.AutomationRuleRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class AutomationRuleService {

    private final AutomationRuleRepository ruleRepository;

    public AutomationRuleService(AutomationRuleRepository ruleRepository) {
        this.ruleRepository = ruleRepository;
    }

    public List<AutomationRule> listar() {
        return ruleRepository.findAll();
    }

    public AutomationRule criar(UUID deviceId, UUID sensorUmidadeId, UUID sensorReservatorioId, UUID atuadorId,
                                 BigDecimal limiarUmidadeMinimo, BigDecimal limiarReservatorioMinimo,
                                 Integer duracaoSegundos) {
        return ruleRepository.save(new AutomationRule(deviceId, sensorUmidadeId, sensorReservatorioId, atuadorId,
                limiarUmidadeMinimo, limiarReservatorioMinimo, duracaoSegundos));
    }

    public AutomationRule habilitar(UUID id) {
        AutomationRule rule = buscar(id);
        rule.habilitar();
        return ruleRepository.save(rule);
    }

    public AutomationRule desabilitar(UUID id) {
        AutomationRule rule = buscar(id);
        rule.desabilitar();
        return ruleRepository.save(rule);
    }

    private AutomationRule buscar(UUID id) {
        return ruleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Regra nao encontrada: " + id));
    }
}
