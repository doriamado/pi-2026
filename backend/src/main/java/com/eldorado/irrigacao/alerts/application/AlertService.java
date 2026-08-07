package com.eldorado.irrigacao.alerts.application;

import com.eldorado.irrigacao.alerts.domain.Alert;
import com.eldorado.irrigacao.alerts.domain.AlertSeverity;
import com.eldorado.irrigacao.alerts.domain.AlertStatus;
import com.eldorado.irrigacao.alerts.repository.AlertRepository;
import com.eldorado.irrigacao.events.application.EventPublisher;
import com.eldorado.irrigacao.events.domain.EventType;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class AlertService {

    private final AlertRepository alertRepository;
    private final EventPublisher eventPublisher;

    public AlertService(AlertRepository alertRepository, EventPublisher eventPublisher) {
        this.alertRepository = alertRepository;
        this.eventPublisher = eventPublisher;
    }

    public Alert disparar(UUID deviceId, String origem, String mensagem, AlertSeverity severidade) {
        Alert alert = alertRepository.save(new Alert(deviceId, origem, mensagem, severidade, Instant.now()));
        eventPublisher.publicar(deviceId, EventType.ALERTA_DISPARADO, mensagem);
        return alert;
    }

    public List<Alert> listarAbertos() {
        return alertRepository.findByStatusOrderByTimestampDesc(AlertStatus.ABERTO);
    }

    public List<Alert> listarPorDevice(UUID deviceId) {
        return alertRepository.findByDeviceIdOrderByTimestampDesc(deviceId);
    }

    public void resolver(UUID id) {
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Alerta nao encontrado: " + id));
        alert.resolver();
        alertRepository.save(alert);
    }
}
