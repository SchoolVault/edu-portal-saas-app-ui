package com.school.erp.modules.ai.job;

import com.school.erp.modules.ai.repository.AiConversationRepository;
import com.school.erp.modules.ai.repository.AiMessageRepository;
import com.school.erp.modules.ai.repository.AiToolLogRepository;
import java.time.LocalDateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class AiChatRetentionCleanupJob {

    private static final Logger log = LoggerFactory.getLogger(AiChatRetentionCleanupJob.class);

    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;
    private final AiToolLogRepository toolLogRepository;

    @Value("${app.ai.retention.enabled:true}")
    private boolean enabled;

    @Value("${app.ai.retention.days:45}")
    private int retentionDays;

    public AiChatRetentionCleanupJob(
            AiConversationRepository conversationRepository,
            AiMessageRepository messageRepository,
            AiToolLogRepository toolLogRepository) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.toolLogRepository = toolLogRepository;
    }

    @Scheduled(cron = "${app.ai.retention.cron:0 40 3 * * *}")
    @Transactional
    public void cleanupExpiredAiChatData() {
        if (!enabled) {
            return;
        }
        int safeDays = Math.max(1, retentionDays);
        LocalDateTime cutoff = LocalDateTime.now().minusDays(safeDays);

        long toolLogsToDelete = toolLogRepository.countByCreatedAtBefore(cutoff);
        long messagesToDelete = messageRepository.countByCreatedAtBefore(cutoff);
        long conversationsToDelete = conversationRepository.countByCreatedAtBefore(cutoff);

        int deletedToolLogs = toolLogRepository.deleteByCreatedAtBefore(cutoff);
        int deletedMessages = messageRepository.deleteByCreatedAtBefore(cutoff);
        int deletedConversations = conversationRepository.deleteByCreatedAtBefore(cutoff);

        log.info(
                "ai_retention done cutoff={} retentionDays={} toolLogs={}/{} messages={}/{} conversations={}/{}",
                cutoff,
                safeDays,
                deletedToolLogs,
                toolLogsToDelete,
                deletedMessages,
                messagesToDelete,
                deletedConversations,
                conversationsToDelete);
    }
}
