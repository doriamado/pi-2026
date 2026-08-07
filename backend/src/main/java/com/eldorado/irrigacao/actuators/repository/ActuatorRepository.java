package com.eldorado.irrigacao.actuators.repository;

import com.eldorado.irrigacao.actuators.domain.Actuator;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ActuatorRepository extends JpaRepository<Actuator, UUID> {
    List<Actuator> findByDeviceId(UUID deviceId);
}
