package com.eldorado.irrigacao.dashboard.api;

import com.eldorado.irrigacao.dashboard.application.DashboardService;
import com.eldorado.irrigacao.dashboard.dto.DashboardSummaryDTO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping
    public DashboardSummaryDTO resumo() {
        return dashboardService.resumo();
    }
}
