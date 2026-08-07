package com.eldorado.irrigacao.automation.repository;

import com.eldorado.irrigacao.automation.domain.AutomationRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AutomationRuleRepository extends JpaRepository<AutomationRule, UUID> {
    List<AutomationRule> findByAtivaTrue();
    List<AutomationRule> findByDeviceId(UUID deviceId);
}
