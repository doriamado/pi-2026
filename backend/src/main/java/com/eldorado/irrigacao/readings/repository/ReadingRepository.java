package com.eldorado.irrigacao.readings.repository;

import com.eldorado.irrigacao.readings.domain.Reading;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReadingRepository extends JpaRepository<Reading, UUID> {

    List<Reading> findBySensorIdAndTimestampBetweenOrderByTimestampAsc(
            UUID sensorId, Instant inicio, Instant fim);

    List<Reading> findByDeviceIdAndTimestampBetweenOrderByTimestampAsc(
            UUID deviceId, Instant inicio, Instant fim);

    Optional<Reading> findFirstBySensorIdOrderByTimestampDesc(UUID sensorId);
}
