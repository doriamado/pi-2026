package com.eldorado.irrigacao.mock;

import com.eldorado.irrigacao.devices.application.DeviceService;
import com.eldorado.irrigacao.gateway.DeviceGateway;
import com.eldorado.irrigacao.gateway.GatewaySource;
import com.eldorado.irrigacao.readings.application.ReadingService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Componente OBRIGATORIO da plataforma.
 *
 * Gera sensores virtuais e simula, a cada ciclo:
 *  - passagem do tempo (evolucao gradual das leituras)
 *  - reducao gradual da umidade do solo
 *  - aumento de temperatura
 *  - reservatorio esvaziando aos poucos
 *  - perda de conexao ocasional
 *
 * Os dados sao gravados exatamente nas mesmas tabelas dos dados reais,
 * apenas marcados com origem = MOCK. Este componente permanece ativo
 * mesmo apos a integracao com hardware real, para uso continuo em testes.
 */
@Service
public class MockGatewayService implements DeviceGateway {

    private final DeviceService deviceService;
    private final ReadingService readingService;
    private final boolean habilitado;
    private final SecureRandom random = new SecureRandom();

    private final Map<UUID, MockSensorState> estados = new ConcurrentHashMap<>();

    public MockGatewayService(DeviceService deviceService,
                               ReadingService readingService,
                               @Value("${irrigacao.mock-gateway.enabled:true}") boolean habilitado) {
        this.deviceService = deviceService;
        this.readingService = readingService;
        this.habilitado = habilitado;
    }

    @Override
    public GatewaySource getSource() {
        return GatewaySource.MOCK;
    }

    @Override
    public void sendCommand(UUID deviceId, UUID actuatorId, String command, BigDecimal durationSeconds) {
        // Em modo mock, comandos apenas sao logados; nao ha hardware real para acionar.
    }

    /** Registra um dispositivo simulado para comecar a gerar leituras. */
    public void registrarDispositivoSimulado(UUID deviceId, UUID sensorUmidadeId,
                                              UUID sensorTemperaturaId, UUID sensorReservatorioId) {
        estados.put(deviceId, new MockSensorState(deviceId, sensorUmidadeId, sensorTemperaturaId, sensorReservatorioId));
    }

    @Scheduled(fixedDelayString = "${irrigacao.mock-gateway.intervalo-simulacao-segundos:10}000")
    public void simularCiclo() {
        if (!habilitado) {
            return;
        }
        for (MockSensorState estado : estados.values()) {
            simularPassagemDoTempo(estado);
            publicarLeituras(estado);
        }
    }

    private void simularPassagemDoTempo(MockSensorState estado) {
        // 3% de chance de perda de conexao neste ciclo
        if (random.nextInt(100) < 3) {
            estado.conectado = false;
            deviceService.marcarOffline(estado.deviceId);
            return;
        }
        if (!estado.conectado) {
            estado.conectado = true;
        }
        deviceService.registrarComunicacao(estado.deviceId);

        // Reducao gradual da umidade do solo
        estado.umidade = clamp(estado.umidade.subtract(variacao(0.5, 2.0)), 0, 100);

        // Aumento gradual de temperatura, com pequena oscilacao
        estado.temperatura = clamp(estado.temperatura.add(variacaoComSinal(0.3)), 10, 45);

        // Reservatorio esvaziando aos poucos
        estado.nivelReservatorio = clamp(estado.nivelReservatorio.subtract(variacao(0.1, 0.8)), 0, 100);
    }

    private void publicarLeituras(MockSensorState estado) {
        readingService.registrar(estado.sensorUmidadeId, estado.deviceId, estado.umidade, "%", GatewaySource.MOCK);
        readingService.registrar(estado.sensorTemperaturaId, estado.deviceId, estado.temperatura, "C", GatewaySource.MOCK);
        readingService.registrar(estado.sensorReservatorioId, estado.deviceId, estado.nivelReservatorio, "%", GatewaySource.MOCK);
    }

    private BigDecimal variacao(double min, double max) {
        double valor = min + (max - min) * random.nextDouble();
        return BigDecimal.valueOf(valor).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal variacaoComSinal(double amplitude) {
        double valor = (random.nextDouble() * 2 - 1) * amplitude;
        return BigDecimal.valueOf(valor).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal clamp(BigDecimal valor, double min, double max) {
        if (valor.doubleValue() < min) return BigDecimal.valueOf(min).setScale(2, RoundingMode.HALF_UP);
        if (valor.doubleValue() > max) return BigDecimal.valueOf(max).setScale(2, RoundingMode.HALF_UP);
        return valor;
    }

    public List<UUID> dispositivosSimulados() {
        return List.copyOf(estados.keySet());
    }
}
