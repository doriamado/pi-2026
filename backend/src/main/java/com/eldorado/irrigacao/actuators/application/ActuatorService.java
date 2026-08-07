package com.eldorado.irrigacao.actuators.application;

import com.eldorado.irrigacao.actuators.domain.Actuator;
import com.eldorado.irrigacao.actuators.domain.ActuatorType;
import com.eldorado.irrigacao.actuators.repository.ActuatorRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class ActuatorService {

    private final ActuatorRepository actuatorRepository;

    public ActuatorService(ActuatorRepository actuatorRepository) {
        this.actuatorRepository = actuatorRepository;
    }

    public List<Actuator> listarPorDevice(UUID deviceId) {
        return actuatorRepository.findByDeviceId(deviceId);
    }

    public Actuator buscar(UUID id) {
        return actuatorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Atuador nao encontrado: " + id));
    }

    public Actuator criar(UUID deviceId, String nome, ActuatorType tipo) {
        return actuatorRepository.save(new Actuator(deviceId, nome, tipo));
    }

    public void ligar(UUID id) {
        Actuator a = buscar(id);
        a.ligar();
        actuatorRepository.save(a);
    }

    public void desligar(UUID id) {
        Actuator a = buscar(id);
        a.desligar();
        actuatorRepository.save(a);
    }
}
