package com.school.erp.modules.importexport.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.modules.communication.dto.AnnouncementDTOs;
import com.school.erp.modules.communication.service.CommunicationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Publishes import-time onboarding announcements in an isolated transaction so duplicate-guard
 * validation does not mark the parent row transaction rollback-only.
 */
@Service
public class ImportOnboardingAnnouncementPublisher {
    private final CommunicationService communicationService;

    public ImportOnboardingAnnouncementPublisher(CommunicationService communicationService) {
        this.communicationService = communicationService;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void publish(Enums.TargetAudience audience, String title, String content) {
        AnnouncementDTOs.CreateAnnouncementRequest req = new AnnouncementDTOs.CreateAnnouncementRequest();
        req.setTitle(title);
        req.setContent(content);
        req.setTargetAudience(audience);
        communicationService.createAnnouncement(req);
    }
}
