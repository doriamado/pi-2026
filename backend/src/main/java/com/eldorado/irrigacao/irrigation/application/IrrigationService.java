package com.eldorado.irrigacao.irrigation.application;

import com.eldorado.irrigacao.actuators.application.ActuatorService;
import com.eldorado.irrigacao.events.application.EventPublisher;
import com.eldorado.irrigacao.events.domain.EventType;
import com.eldorado.irrigacao.irrigation.domain.IrrigationSession;
import com.eldorado.irrigacao.irrigation.domain.IrrigationSessionStatus;
import com.eldorado.irrigacao.irrigation.repository.IrrigationSessionRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Orquestra o inicio/fim de sessoes de irrigacao, seja disparado manualmente
 * pela API ou automaticamente pelo AutomationEngineService.
 */
@Service
public class IrrigationService {

    private final IrrigationSessionRepository sessionRepository;
    private final ActuatorService actuatorService;
    private final EventPublisher eventPublisher;

    public IrrigationService(IrrigationSessionRepository sessionRepository,
                              ActuatorService actuatorService,
                              EventPublisher eventPublisher) {
        this.sessionRepository = sessionRepository;
        this.actuatorService = actuatorService;
        this.eventPublisher = eventPublisher;
    }

    public IrrigationSession iniciar(UUID deviceId, UUID atuadorId, UUID automationRuleId) {
        Optional<IrrigationSession> emAndamento = sessionRepository
                .findFirstByDeviceIdAndStatusOrderByStartTimeDesc(deviceId, IrrigationSessionStatus.EM_ANDAMENTO);
        if (emAndamento.isPresent()) {
            return emAndamento.get();
        }
        actuatorService.ligar(atuadorId);
        IrrigationSession session = sessionRepository.save(
                new IrrigationSession(deviceId, atuadorId, automationRuleId, Instant.now()));
        eventPublisher.publicar(deviceId, EventType.IRRIGACAO_INICIADA,
                "Irrigacao iniciada" + (automationRuleId != null ? " automaticamente" : " manualmente"));
        return session;
    }

    public void encerrar(UUID deviceId) {
        sessionRepository.findFirstByDeviceIdAndStatusOrderByStartTimeDesc(deviceId, IrrigationSessionStatus.EM_ANDAMENTO)
                .ifPresent(session -> {
                    actuatorService.desligar(session.getAtuadorId());
                    session.encerrar(Instant.now());
                    sessionRepository.save(session);
                    eventPublisher.publicar(deviceId, EventType.IRRIGACAO_ENCERRADA, "Irrigacao encerrada");
                });
    }

    public Optional<IrrigationSession> statusAtual(UUID deviceId) {
        return sessionRepository.findFirstByDeviceIdAndStatusOrderByStartTimeDesc(deviceId, IrrigationSessionStatus.EM_ANDAMENTO);
    }
}
