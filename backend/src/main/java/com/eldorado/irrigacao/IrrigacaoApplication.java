package com.eldorado.irrigacao;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Ponto de entrada da plataforma de irrigacao inteligente.
 *
 * Nao ha modulo de autenticacao nesta v1 (decisao explicita do produto).
 * Toda regra de negocio vive no dominio, nunca nos controllers.
 */
@SpringBootApplication
@EnableScheduling
public class IrrigacaoApplication {

    public static void main(String[] args) {
        SpringApplication.run(IrrigacaoApplication.class, args);
    }
}
