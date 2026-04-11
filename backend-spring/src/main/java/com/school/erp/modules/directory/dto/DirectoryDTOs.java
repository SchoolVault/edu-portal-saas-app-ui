package com.school.erp.modules.directory.dto;

import java.util.ArrayList;
import java.util.List;

/** Frontend mirror: {@code frontend/src/app/core/models/directory.dto.ts} ({@code DirectoryDtos}). */
public class DirectoryDTOs {

    public static class Entry {
        private String kind;
        private Long id;
        private String displayName;
        private String subtitle;
        private String email;
        private String phone;
        private String deepLink;
        /** ERP user id for starting a direct chat (parent login, teacher login, etc.). */
        private String chatUserId;
        private String chatTargetRole;
        private String contextType;
        private String contextId;

        public String getKind() {
            return kind;
        }

        public void setKind(String kind) {
            this.kind = kind;
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getDisplayName() {
            return displayName;
        }

        public void setDisplayName(String displayName) {
            this.displayName = displayName;
        }

        public String getSubtitle() {
            return subtitle;
        }

        public void setSubtitle(String subtitle) {
            this.subtitle = subtitle;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }

        public String getDeepLink() {
            return deepLink;
        }

        public void setDeepLink(String deepLink) {
            this.deepLink = deepLink;
        }

        public String getChatUserId() {
            return chatUserId;
        }

        public void setChatUserId(String chatUserId) {
            this.chatUserId = chatUserId;
        }

        public String getChatTargetRole() {
            return chatTargetRole;
        }

        public void setChatTargetRole(String chatTargetRole) {
            this.chatTargetRole = chatTargetRole;
        }

        public String getContextType() {
            return contextType;
        }

        public void setContextType(String contextType) {
            this.contextType = contextType;
        }

        public String getContextId() {
            return contextId;
        }

        public void setContextId(String contextId) {
            this.contextId = contextId;
        }
    }

    public static class SearchResponse {
        private String query;
        private List<Entry> results = new ArrayList<>();

        public String getQuery() {
            return query;
        }

        public void setQuery(String query) {
            this.query = query;
        }

        public List<Entry> getResults() {
            return results;
        }

        public void setResults(List<Entry> results) {
            this.results = results;
        }
    }
}
