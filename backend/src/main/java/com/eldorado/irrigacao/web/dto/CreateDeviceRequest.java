package com.eldorado.irrigacao.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CreateDeviceRequest(
        @NotBlank(message = "Informe o nome do dispositivo.") String name,
        @NotBlank(message = "Selecione o tipo do dispositivo.") String type,
        @NotBlank(message = "Informe o código de identificação.")
        @Pattern(regexp = "[A-Z0-9-]{4,40}", message = "Código de identificação inválido. Use o código impresso no dispositivo.")
        String id,
        String location) {
}
