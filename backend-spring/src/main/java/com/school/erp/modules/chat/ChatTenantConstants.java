package com.school.erp.modules.chat;

/**
 * Cross-workspace operator threads (super admin ↔ campus admins) are stored under this tenant bucket
 * so both sides resolve the same {@code chat_conversations} / {@code chat_participants} rows.
 */
public final class ChatTenantConstants {
    public static final String PLATFORM_BRIDGE_TENANT = "platform";

    private ChatTenantConstants() {}
}
