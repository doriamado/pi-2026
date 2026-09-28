package com.eldorado.irrigacao.web.dto;

import jakarta.validation.constraints.NotNull;

public record ReadingIngestRequest(
        @NotNull Double moisture,
        @NotNull Double temperature,
        @NotNull Double water) {
}
