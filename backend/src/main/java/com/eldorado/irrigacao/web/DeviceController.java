package com.eldorado.irrigacao.web;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.eldorado.irrigacao.service.DeviceService;
import com.eldorado.irrigacao.web.dto.*;

@RestController
@RequestMapping("/api/devices")
public class DeviceController {

    private final DeviceService service;

    public DeviceController(DeviceService service) {
        this.service = service;
    }

    @GetMapping
    public List<DeviceSummaryDto> list() {
        return service.listSummaries();
    }

    @GetMapping("/{id}")
    public DeviceDetailDto get(@PathVariable String id, @RequestParam(defaultValue = "1") int days) {
        return service.getDetail(id, days);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DeviceSummaryDto create(@Valid @RequestBody CreateDeviceRequest req) {
        return service.create(req);
    }

    @PatchMapping("/{id}/settings")
    public DeviceDetailDto updateSettings(@PathVariable String id, @Valid @RequestBody DeviceSettingsRequest req) {
        return service.updateSettings(id, req);
    }

    @PostMapping("/{id}/irrigation/start")
    public DeviceDetailDto startIrrigation(@PathVariable String id, @RequestBody(required = false) IrrigationStartRequest req) {
        return service.startIrrigation(id, req == null ? null : req.minutes());
    }

    @PostMapping("/{id}/irrigation/stop")
    public DeviceDetailDto stopIrrigation(@PathVariable String id) {
        return service.stopIrrigation(id);
    }
}
