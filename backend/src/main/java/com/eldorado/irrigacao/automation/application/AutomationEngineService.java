package com.eldorado.irrigacao.automation.application;

import com.eldorado.irrigacao.automation.domain.AutomationRule;
import com.eldorado.irrigacao.automation.repository.AutomationRuleRepository;
import com.eldorado.irrigacao.irrigation.application.IrrigationService;
import com.eldorado.irrigacao.readings.application.ReadingService;
import com.eldorado.irrigacao.readings.domain.Reading;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Optional;

/**
 * Motor de automacao baseado em regras (v1).
 *
 * A cada ciclo, avalia todas as regras ativas contra a leitura mais recente
 * de umidade e de nivel do reservatorio, e aciona a irrigacao quando a
 * condicao for satisfeita.
 *
 * Este motor podera ser substituido por um motor baseado em IA no futuro
 * sem qualquer alteracao na API publica (POST /irrigation/start ja existe
 * e sera reutilizado da mesma forma).
 */
@Service
public class AutomationEngineService {

    private final AutomationRuleRepository ruleRepository;
    private final ReadingService readingService;
    private final IrrigationService irrigationService;

    public AutomationEngineService(AutomationRuleRepository ruleRepository,
                                    ReadingService readingService,
                                    IrrigationService irrigationService) {
        this.ruleRepository = ruleRepository;
        this.readingService = readingService;
        this.irrigationService = irrigationService;
    }

    @Scheduled(fixedDelayString = "${irrigacao.automation.intervalo-avaliacao-ms:15000}")
    public void avaliarRegras() {
        for (AutomationRule regra : ruleRepository.findByAtivaTrue()) {
            avaliar(regra);
        }
    }

    private void avaliar(AutomationRule regra) {
        Optional<Reading> umidade = readingService.ultimaLeitura(regra.getSensorUmidadeId());
        Optional<Reading> reservatorio = readingService.ultimaLeitura(regra.getSensorReservatorioId());

        if (umidade.isEmpty() || reservatorio.isEmpty()) {
            return;
        }

        BigDecimal valorUmidade = umidade.get().getValor();
        BigDecimal valorReservatorio = reservatorio.get().getValor();

        if (regra.deveAcionar(valorUmidade, valorReservatorio)) {
            irrigationService.iniciar(regra.getDeviceId(), regra.getAtuadorId(), regra.getId());
        }
    }
}
