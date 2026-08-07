package com.eldorado.irrigacao.alerts.repository;

import com.eldorado.irrigacao.alerts.domain.Alert;
import com.eldorado.irrigacao.alerts.domain.AlertStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AlertRepository extends JpaRepository<Alert, UUID> {
    List<Alert> findByStatusOrderByTimestampDesc(AlertStatus status);
    List<Alert> findByDeviceIdOrderByTimestampDesc(UUID deviceId);
}
