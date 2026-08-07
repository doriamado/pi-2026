package com.eldorado.irrigacao.readings.application;

import com.eldorado.irrigacao.events.application.EventPublisher;
import com.eldorado.irrigacao.events.domain.EventType;
import com.eldorado.irrigacao.gateway.GatewaySource;
import com.eldorado.irrigacao.readings.domain.Reading;
import com.eldorado.irrigacao.readings.repository.ReadingRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ReadingService {

    private final ReadingRepository readingRepository;
    private final EventPublisher eventPublisher;

    public ReadingService(ReadingRepository readingRepository, EventPublisher eventPublisher) {
        this.readingRepository = readingRepository;
        this.eventPublisher = eventPublisher;
    }

    public Reading registrar(UUID sensorId, UUID deviceId, BigDecimal valor, String unidade, GatewaySource origem) {
        Reading reading = new Reading(sensorId, deviceId, valor, unidade, origem, Instant.now());
        Reading salvo = readingRepository.save(reading);
        eventPublisher.publicar(deviceId, EventType.LEITURA_RECEBIDA,
                "Leitura recebida do sensor " + sensorId + ": " + valor + unidade);
        return salvo;
    }

    public List<Reading> historicoPorSensor(UUID sensorId, Instant inicio, Instant fim) {
        return readingRepository.findBySensorIdAndTimestampBetweenOrderByTimestampAsc(sensorId, inicio, fim);
    }

    public List<Reading> historicoPorDevice(UUID deviceId, Instant inicio, Instant fim) {
        return readingRepository.findByDeviceIdAndTimestampBetweenOrderByTimestampAsc(deviceId, inicio, fim);
    }

    public Optional<Reading> ultimaLeitura(UUID sensorId) {
        return readingRepository.findFirstBySensorIdOrderByTimestampDesc(sensorId);
    }
}
