package com.eldorado.irrigacao.mock;

import com.eldorado.irrigacao.alerts.application.AlertService;
import com.eldorado.irrigacao.alerts.domain.AlertSeverity;
import com.eldorado.irrigacao.automation.application.AutomationEngineService;
import com.eldorado.irrigacao.devices.application.DeviceService;
import com.eldorado.irrigacao.devices.domain.Device;
import com.eldorado.irrigacao.devices.domain.DeviceType;
import com.eldorado.irrigacao.gateway.GatewaySource;
import com.eldorado.irrigacao.readings.application.ReadingService;
import com.eldorado.irrigacao.sensors.application.SensorService;
import com.eldorado.irrigacao.sensors.domain.Sensor;
import com.eldorado.irrigacao.sensors.domain.SensorType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Coracao do Mock Gateway: gera sensores virtuais e simula, ao longo do tempo:
 *  - reducao gradual da umidade do solo (ate que uma irrigacao "reabasteca");
 *  - aumento gradual da temperatura;
 *  - esvaziamento do reservatorio;
 *  - perda de conexao esporadica de dispositivos mock.
 *
 * Mantido intencionalmente simples (estado em memoria) nesta v1 de estruturacao;
 * pode evoluir para persistir o "estado simulado" se necessario.
 */
@Component
public class MockSimulationScheduler {

    private final DeviceService deviceService;
    private final SensorService sensorService;
    private final ReadingService readingService;
    private final AlertService alertService;
    private final AutomationEngineService automationEngineService;
    private final boolean enabled;

    // estado simulado por sensor (chave = sensorId)
    private final Map<UUID, BigDecimal> estadoUmidade = new ConcurrentHashMap<>();
    private final Map<UUID, BigDecimal> estadoTemperatura = new ConcurrentHashMap<>();
    private final Map<UUID, BigDecimal> estadoReservatorio = new ConcurrentHashMap<>();

    public MockSimulationScheduler(DeviceService deviceService,
                                    SensorService sensorService,
                                    ReadingService readingService,
                                    AlertService alertService,
                                    AutomationEngineService automationEngineService,
                                    @Value("${irrigacao.mock-gateway.enabled:true}") boolean enabled) {
        this.deviceService = deviceService;
        this.sensorService = sensorService;
        this.readingService = readingService;
        this.alertService = alertService;
        this.automationEngineService = automationEngineService;
        this.enabled = enabled;
    }

    @Scheduled(fixedDelayString = "${irrigacao.mock-gateway.intervalo-simulacao-segundos:10}000")
    public void simularCicloDeLeituras() {
        if (!enabled) return;

        List<Device> mocks = deviceService.listar().stream()
                .filter(d -> d.getTipo() == DeviceType.MOCK_DEVICE)
                .toList();

        for (Device device : mocks) {
            deviceService.registrarComunicacao(device.getId());

            BigDecimal nivelReservatorio = null;

            for (Sensor sensor : sensorService.listarPorDevice(device.getId())) {
                BigDecimal valor = switch (sensor.getTipo()) {
                    case UMIDADE_SOLO -> proximoValorUmidade(sensor.getId());
                    case TEMPERATURA -> proximoValorTemperatura(sensor.getId());
                    case NIVEL_RESERVATORIO -> proximoValorReservatorio(sensor.getId());
                };

                readingService.registrar(sensor.getId(), device.getId(), valor,
                        unidadePara(sensor.getTipo()), GatewaySource.MOCK);

                if (sensor.getTipo() == SensorType.NIVEL_RESERVATORIO) {
                    nivelReservatorio = valor;
                    if (valor.compareTo(BigDecimal.valueOf(5)) <= 0) {
                        alertService.disparar(device.getId(), "mock-gateway",
                                "Reservatorio quase vazio (" + valor + "%)", AlertSeverity.ALTA);
                    }
                }
            }

            if (nivelReservatorio != null) {
                automationEngineService.avaliarTodas(nivelReservatorio);
            }
        }
    }

    private BigDecimal proximoValorUmidade(UUID sensorId) {
        BigDecimal atual = estadoUmidade.getOrDefault(sensorId, BigDecimal.valueOf(60));
        // reducao gradual, com piso em 5%
        BigDecimal novo = atual.subtract(BigDecimal.valueOf(1.5)).max(BigDecimal.valueOf(5));
        estadoUmidade.put(sensorId, novo);
        return novo.setScale(1, RoundingMode.HALF_UP);
    }

    private BigDecimal proximoValorTemperatura(UUID sensorId) {
        BigDecimal atual = estadoTemperatura.getOrDefault(sensorId, BigDecimal.valueOf(24));
        // aumento gradual, com teto em 42 graus
        BigDecimal novo = atual.add(BigDecimal.valueOf(0.3)).min(BigDecimal.valueOf(42));
        estadoTemperatura.put(sensorId, novo);
        return novo.setScale(1, RoundingMode.HALF_UP);
    }

    private BigDecimal proximoValorReservatorio(UUID sensorId) {
        BigDecimal atual = estadoReservatorio.getOrDefault(sensorId, BigDecimal.valueOf(100));
        // esvaziamento gradual, com piso em 0%
        BigDecimal novo = atual.subtract(BigDecimal.valueOf(0.8)).max(BigDecimal.ZERO);
        estadoReservatorio.put(sensorId, novo);
        return novo.setScale(1, RoundingMode.HALF_UP);
    }

    /** Chamado pelo motor de automacao/servico de irrigacao quando uma bomba liga, para "reabastecer" a umidade simulada. */
    public void registrarIrrigacao(UUID sensorUmidadeId) {
        estadoUmidade.put(sensorUmidadeId, BigDecimal.valueOf(70));
    }

    private String unidadePara(SensorType tipo) {
        return switch (tipo) {
            case UMIDADE_SOLO -> "%";
            case TEMPERATURA -> "C";
            case NIVEL_RESERVATORIO -> "%";
        };
    }
}
