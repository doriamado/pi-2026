package com.eldorado.irrigacao.irrigation.repository;

import com.eldorado.irrigacao.irrigation.domain.IrrigationSession;
import com.eldorado.irrigacao.irrigation.domain.IrrigationSessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IrrigationSessionRepository extends JpaRepository<IrrigationSession, UUID> {
    Optional<IrrigationSession> findFirstByDeviceIdAndStatusOrderByStartTimeDesc(
            UUID deviceId, IrrigationSessionStatus status);
    List<IrrigationSession> findByDeviceIdOrderByStartTimeDesc(UUID deviceId);
}
