package com.eldorado.irrigacao.devices.application;

import com.eldorado.irrigacao.devices.domain.Device;
import com.eldorado.irrigacao.devices.domain.DeviceType;
import com.eldorado.irrigacao.devices.repository.DeviceRepository;
import com.eldorado.irrigacao.events.application.EventPublisher;
import com.eldorado.irrigacao.events.domain.EventType;
import com.eldorado.irrigacao.gateway.GatewaySource;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class DeviceService {

    private final DeviceRepository deviceRepository;
    private final EventPublisher eventPublisher;

    public DeviceService(DeviceRepository deviceRepository, EventPublisher eventPublisher) {
        this.deviceRepository = deviceRepository;
        this.eventPublisher = eventPublisher;
    }

    public List<Device> listar() {
        return deviceRepository.findAll();
    }

    public Device buscar(UUID id) {
        return deviceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Device nao encontrado: " + id));
    }

    public Device criar(String nome, DeviceType tipo, GatewaySource origem, UUID userId) {
        return deviceRepository.save(new Device(nome, tipo, origem, userId));
    }

    public void remover(UUID id) {
        deviceRepository.deleteById(id);
    }

    public void registrarComunicacao(UUID deviceId) {
        Device device = buscar(deviceId);
        boolean estavaOffline = device.getStatus().name().equals("OFFLINE")
                || device.getStatus().name().equals("DESCONHECIDO");
        device.registrarComunicacao(Instant.now());
        deviceRepository.save(device);
        if (estavaOffline) {
            eventPublisher.publicar(deviceId, EventType.SENSOR_CONECTADO, "Dispositivo voltou a comunicar");
        }
    }

    public void marcarOffline(UUID deviceId) {
        Device device = buscar(deviceId);
        device.marcarOffline();
        deviceRepository.save(device);
        eventPublisher.publicar(deviceId, EventType.FALHA_COMUNICACAO, "Dispositivo parou de comunicar");
    }
}
