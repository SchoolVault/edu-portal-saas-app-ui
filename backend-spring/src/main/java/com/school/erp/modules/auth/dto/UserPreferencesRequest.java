package com.school.erp.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Extensible user preferences; start with interface language. Validate allowed tags in service via {@link com.school.erp.common.locale.InterfaceLocale}.
 */
public class UserPreferencesRequest {

    @NotBlank(message = "Interface language is required")
    @Size(max = 16)
    private String interfaceLocale;

    public String getInterfaceLocale() {
        return interfaceLocale;
    }

    public void setInterfaceLocale(String interfaceLocale) {
        this.interfaceLocale = interfaceLocale;
    }
}
