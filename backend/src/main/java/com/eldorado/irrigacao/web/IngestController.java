package com.eldorado.irrigacao.web;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.eldorado.irrigacao.service.IngestService;
import com.eldorado.irrigacao.web.dto.ReadingIngestRequest;

/** Endpoint que o firmware do Arduino chama para enviar cada leitura de sensor. */
@RestController
@RequestMapping("/api/ingest")
public class IngestController {

    private final IngestService service;

    @Value("${irrigacao.ingestao.chave-api:}")
    private String apiKey;

    public IngestController(IngestService service) {
        this.service = service;
    }

    @PostMapping("/{deviceId}/readings")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void ingest(@PathVariable String deviceId, @Valid @RequestBody ReadingIngestRequest req,
            @RequestHeader(value = "X-Device-Key", required = false) String deviceKey) {
        if (apiKey != null && !apiKey.isBlank() && !apiKey.equals(deviceKey)) {
            throw new ApiException(org.springframework.http.HttpStatus.UNAUTHORIZED, "Chave de dispositivo inválida.");
        }
        service.ingest(deviceId, req.moisture(), req.temperature(), req.water());
    }
}
