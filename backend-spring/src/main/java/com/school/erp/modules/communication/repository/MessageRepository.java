package com.school.erp.modules.communication.repository;

import com.school.erp.modules.communication.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Long> {
    Optional<Message> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);

    @Query("SELECT m FROM Message m WHERE m.tenantId = :t AND (m.senderId = :userId OR m.receiverId = :userId) AND m.isDeleted = false ORDER BY m.createdAt DESC")
    List<Message> findUserMessages(String t, Long userId);
    @Query("SELECT m FROM Message m WHERE m.tenantId = :t AND (m.senderId = :userId OR m.receiverId = :userId) AND m.isDeleted = false")
    Page<Message> findUserMessagesPage(String t, Long userId, Pageable pageable);

    @Query("SELECT m FROM Message m WHERE m.tenantId = :t AND ((m.senderId = :user1 AND m.receiverId = :user2) OR (m.senderId = :user2 AND m.receiverId = :user1)) AND m.isDeleted = false ORDER BY m.createdAt ASC")
    List<Message> findConversation(String t, Long user1, Long user2);
    @Query("SELECT m FROM Message m WHERE m.tenantId = :t AND ((m.senderId = :user1 AND m.receiverId = :user2) OR (m.senderId = :user2 AND m.receiverId = :user1)) AND m.isDeleted = false")
    Page<Message> findConversationPage(String t, Long user1, Long user2, Pageable pageable);

    long countByTenantIdAndReceiverIdAndIsReadFalse(String t, Long receiverId);
}
