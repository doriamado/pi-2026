package com.eldorado.irrigacao.sensors.application;

import com.eldorado.irrigacao.sensors.domain.Sensor;
import com.eldorado.irrigacao.sensors.domain.SensorType;
import com.eldorado.irrigacao.sensors.repository.SensorRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class SensorService {

    private final SensorRepository sensorRepository;

    public SensorService(SensorRepository sensorRepository) {
        this.sensorRepository = sensorRepository;
    }

    public List<Sensor> listar() {
        return sensorRepository.findAll();
    }

    public List<Sensor> listarPorDevice(UUID deviceId) {
        return sensorRepository.findByDeviceId(deviceId);
    }

    public Sensor buscar(UUID id) {
        return sensorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Sensor nao encontrado: " + id));
    }

    public Sensor criar(UUID deviceId, String nome, SensorType tipo) {
        return sensorRepository.save(new Sensor(deviceId, nome, tipo));
    }
}
