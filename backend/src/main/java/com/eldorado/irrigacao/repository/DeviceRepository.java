package com.eldorado.irrigacao.repository;

import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.eldorado.irrigacao.domain.Device;

@Repository
public class DeviceRepository {

    private static final String SELECT = "SELECT * FROM verda.device";

    private final JdbcTemplate jdbc;
    private final DeviceRowMapper mapper = new DeviceRowMapper();

    public DeviceRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Device> findAll() {
        return jdbc.query(SELECT + " ORDER BY created_at", mapper);
    }

    public Optional<Device> findById(String id) {
        return jdbc.query(SELECT + " WHERE id = ?", mapper, id).stream().findFirst();
    }

    public boolean existsById(String id) {
        Integer count = jdbc.queryForObject("SELECT count(*) FROM verda.device WHERE id = ?", Integer.class, id);
        return count != null && count > 0;
    }

    public void insert(Device d) {
        jdbc.update("""
                INSERT INTO verda.device
                    (id, name, location, type, min_moisture, default_duration_min,
                     auto_irrigation, disconnect_alerts, schedule_time, water)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                d.id(), d.name(), d.location(), d.type(), d.minMoisture(), d.defaultDurationMin(),
                d.autoIrrigation(), d.disconnectAlerts(), d.scheduleTime(), d.water());
    }

    /** Chamado a cada leitura recebida (real ou simulada): grava a última leitura no cabeçalho do dispositivo. */
    public void applyReading(String id, double moisture, double temperature, double water, OffsetDateTime at) {
        jdbc.update("""
                UPDATE verda.device
                   SET moisture = ?, temperature = ?, water = ?, last_seen_at = ?
                 WHERE id = ?
                """, moisture, temperature, water, at, id);
    }

    public void updateSettings(String id, int minMoisture, int defaultDurationMin, boolean autoIrrigation, boolean disconnectAlerts) {
        jdbc.update("""
                UPDATE verda.device
                   SET min_moisture = ?, default_duration_min = ?, auto_irrigation = ?, disconnect_alerts = ?
                 WHERE id = ?
                """, minMoisture, defaultDurationMin, autoIrrigation, disconnectAlerts, id);
    }

    public void startIrrigation(String id, OffsetDateTime until, String mode, int minutes) {
        jdbc.update("""
                UPDATE verda.device SET irrigating_until = ?, irrigation_mode = ?, irrigation_minutes = ?
                 WHERE id = ?
                """, until, mode, minutes, id);
    }

    public void stopIrrigation(String id) {
        jdbc.update("""
                UPDATE verda.device SET irrigating_until = NULL, irrigation_mode = NULL, irrigation_minutes = 0
                 WHERE id = ?
                """, id);
    }

    public List<Device> findWithIrrigationEndingBefore(OffsetDateTime moment) {
        return jdbc.query(SELECT + " WHERE irrigating_until IS NOT NULL AND irrigating_until <= ?", mapper, moment);
    }
}
