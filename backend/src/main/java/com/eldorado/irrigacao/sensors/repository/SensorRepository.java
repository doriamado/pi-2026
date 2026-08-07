package com.eldorado.irrigacao.sensors.repository;

import com.eldorado.irrigacao.sensors.domain.Sensor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SensorRepository extends JpaRepository<Sensor, UUID> {
    List<Sensor> findByDeviceId(UUID deviceId);
}
