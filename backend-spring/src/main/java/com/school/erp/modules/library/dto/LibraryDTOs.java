package com.school.erp.modules.library.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class LibraryDTOs {

    public static class IssueBookRequest {
        @NotNull
        private Long bookId;
        @NotNull
        private Long studentId;
        private String studentName;
        private Integer dueDays; // default 14


        public static class IssueBookRequestBuilder {
            private Long bookId;
            private Long studentId;
            private String studentName;
            private Integer dueDays;

            IssueBookRequestBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public LibraryDTOs.IssueBookRequest.IssueBookRequestBuilder bookId(final Long bookId) {
                this.bookId = bookId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public LibraryDTOs.IssueBookRequest.IssueBookRequestBuilder studentId(final Long studentId) {
                this.studentId = studentId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public LibraryDTOs.IssueBookRequest.IssueBookRequestBuilder studentName(final String studentName) {
                this.studentName = studentName;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public LibraryDTOs.IssueBookRequest.IssueBookRequestBuilder dueDays(final Integer dueDays) {
                this.dueDays = dueDays;
                return this;
            }

            public LibraryDTOs.IssueBookRequest build() {
                return new LibraryDTOs.IssueBookRequest(this.bookId, this.studentId, this.studentName, this.dueDays);
            }

            @Override
            public String toString() {
                return "LibraryDTOs.IssueBookRequest.IssueBookRequestBuilder(bookId=" + this.bookId + ", studentId=" + this.studentId + ", studentName=" + this.studentName + ", dueDays=" + this.dueDays + ")";
            }
        }

        public static LibraryDTOs.IssueBookRequest.IssueBookRequestBuilder builder() {
            return new LibraryDTOs.IssueBookRequest.IssueBookRequestBuilder();
        }

        public Long getBookId() {
            return this.bookId;
        }

        public Long getStudentId() {
            return this.studentId;
        }

        public String getStudentName() {
            return this.studentName;
        }

        public Integer getDueDays() {
            return this.dueDays;
        }

        public void setBookId(final Long bookId) {
            this.bookId = bookId;
        }

        public void setStudentId(final Long studentId) {
            this.studentId = studentId;
        }

        public void setStudentName(final String studentName) {
            this.studentName = studentName;
        }

        public void setDueDays(final Integer dueDays) {
            this.dueDays = dueDays;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof LibraryDTOs.IssueBookRequest)) return false;
            final LibraryDTOs.IssueBookRequest other = (LibraryDTOs.IssueBookRequest) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$bookId = this.getBookId();
            final Object other$bookId = other.getBookId();
            if (this$bookId == null ? other$bookId != null : !this$bookId.equals(other$bookId)) return false;
            final Object this$studentId = this.getStudentId();
            final Object other$studentId = other.getStudentId();
            if (this$studentId == null ? other$studentId != null : !this$studentId.equals(other$studentId)) return false;
            final Object this$dueDays = this.getDueDays();
            final Object other$dueDays = other.getDueDays();
            if (this$dueDays == null ? other$dueDays != null : !this$dueDays.equals(other$dueDays)) return false;
            final Object this$studentName = this.getStudentName();
            final Object other$studentName = other.getStudentName();
            if (this$studentName == null ? other$studentName != null : !this$studentName.equals(other$studentName)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof LibraryDTOs.IssueBookRequest;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $bookId = this.getBookId();
            result = result * PRIME + ($bookId == null ? 43 : $bookId.hashCode());
            final Object $studentId = this.getStudentId();
            result = result * PRIME + ($studentId == null ? 43 : $studentId.hashCode());
            final Object $dueDays = this.getDueDays();
            result = result * PRIME + ($dueDays == null ? 43 : $dueDays.hashCode());
            final Object $studentName = this.getStudentName();
            result = result * PRIME + ($studentName == null ? 43 : $studentName.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "LibraryDTOs.IssueBookRequest(bookId=" + this.getBookId() + ", studentId=" + this.getStudentId() + ", studentName=" + this.getStudentName() + ", dueDays=" + this.getDueDays() + ")";
        }

        public IssueBookRequest() {
        }

        public IssueBookRequest(final Long bookId, final Long studentId, final String studentName, final Integer dueDays) {
            this.bookId = bookId;
            this.studentId = studentId;
            this.studentName = studentName;
            this.dueDays = dueDays;
        }
    }


    public static class BookIssueResponse {
        private Long id;
        private Long bookId;
        private String bookTitle;
        private Long studentId;
        private String studentName;
        private String issueDate;
        private String dueDate;
        private String returnDate;
        private BigDecimal fine;
        private String status;


        public static class BookIssueResponseBuilder {
            private Long id;
            private Long bookId;
            private String bookTitle;
            private Long studentId;
            private String studentName;
            private String issueDate;
            private String dueDate;
            private String returnDate;
            private BigDecimal fine;
            private String status;

            BookIssueResponseBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public LibraryDTOs.BookIssueResponse.BookIssueResponseBuilder id(final Long id) {
                this.id = id;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public LibraryDTOs.BookIssueResponse.BookIssueResponseBuilder bookId(final Long bookId) {
                this.bookId = bookId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public LibraryDTOs.BookIssueResponse.BookIssueResponseBuilder bookTitle(final String bookTitle) {
                this.bookTitle = bookTitle;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public LibraryDTOs.BookIssueResponse.BookIssueResponseBuilder studentId(final Long studentId) {
                this.studentId = studentId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public LibraryDTOs.BookIssueResponse.BookIssueResponseBuilder studentName(final String studentName) {
                this.studentName = studentName;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public LibraryDTOs.BookIssueResponse.BookIssueResponseBuilder issueDate(final String issueDate) {
                this.issueDate = issueDate;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public LibraryDTOs.BookIssueResponse.BookIssueResponseBuilder dueDate(final String dueDate) {
                this.dueDate = dueDate;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public LibraryDTOs.BookIssueResponse.BookIssueResponseBuilder returnDate(final String returnDate) {
                this.returnDate = returnDate;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public LibraryDTOs.BookIssueResponse.BookIssueResponseBuilder fine(final BigDecimal fine) {
                this.fine = fine;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public LibraryDTOs.BookIssueResponse.BookIssueResponseBuilder status(final String status) {
                this.status = status;
                return this;
            }

            public LibraryDTOs.BookIssueResponse build() {
                return new LibraryDTOs.BookIssueResponse(this.id, this.bookId, this.bookTitle, this.studentId, this.studentName, this.issueDate, this.dueDate, this.returnDate, this.fine, this.status);
            }

            @Override
            public String toString() {
                return "LibraryDTOs.BookIssueResponse.BookIssueResponseBuilder(id=" + this.id + ", bookId=" + this.bookId + ", bookTitle=" + this.bookTitle + ", studentId=" + this.studentId + ", studentName=" + this.studentName + ", issueDate=" + this.issueDate + ", dueDate=" + this.dueDate + ", returnDate=" + this.returnDate + ", fine=" + this.fine + ", status=" + this.status + ")";
            }
        }

        public static LibraryDTOs.BookIssueResponse.BookIssueResponseBuilder builder() {
            return new LibraryDTOs.BookIssueResponse.BookIssueResponseBuilder();
        }

        public Long getId() {
            return this.id;
        }

        public Long getBookId() {
            return this.bookId;
        }

        public String getBookTitle() {
            return this.bookTitle;
        }

        public Long getStudentId() {
            return this.studentId;
        }

        public String getStudentName() {
            return this.studentName;
        }

        public String getIssueDate() {
            return this.issueDate;
        }

        public String getDueDate() {
            return this.dueDate;
        }

        public String getReturnDate() {
            return this.returnDate;
        }

        public BigDecimal getFine() {
            return this.fine;
        }

        public String getStatus() {
            return this.status;
        }

        public void setId(final Long id) {
            this.id = id;
        }

        public void setBookId(final Long bookId) {
            this.bookId = bookId;
        }

        public void setBookTitle(final String bookTitle) {
            this.bookTitle = bookTitle;
        }

        public void setStudentId(final Long studentId) {
            this.studentId = studentId;
        }

        public void setStudentName(final String studentName) {
            this.studentName = studentName;
        }

        public void setIssueDate(final String issueDate) {
            this.issueDate = issueDate;
        }

        public void setDueDate(final String dueDate) {
            this.dueDate = dueDate;
        }

        public void setReturnDate(final String returnDate) {
            this.returnDate = returnDate;
        }

        public void setFine(final BigDecimal fine) {
            this.fine = fine;
        }

        public void setStatus(final String status) {
            this.status = status;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof LibraryDTOs.BookIssueResponse)) return false;
            final LibraryDTOs.BookIssueResponse other = (LibraryDTOs.BookIssueResponse) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$id = this.getId();
            final Object other$id = other.getId();
            if (this$id == null ? other$id != null : !this$id.equals(other$id)) return false;
            final Object this$bookId = this.getBookId();
            final Object other$bookId = other.getBookId();
            if (this$bookId == null ? other$bookId != null : !this$bookId.equals(other$bookId)) return false;
            final Object this$studentId = this.getStudentId();
            final Object other$studentId = other.getStudentId();
            if (this$studentId == null ? other$studentId != null : !this$studentId.equals(other$studentId)) return false;
            final Object this$bookTitle = this.getBookTitle();
            final Object other$bookTitle = other.getBookTitle();
            if (this$bookTitle == null ? other$bookTitle != null : !this$bookTitle.equals(other$bookTitle)) return false;
            final Object this$studentName = this.getStudentName();
            final Object other$studentName = other.getStudentName();
            if (this$studentName == null ? other$studentName != null : !this$studentName.equals(other$studentName)) return false;
            final Object this$issueDate = this.getIssueDate();
            final Object other$issueDate = other.getIssueDate();
            if (this$issueDate == null ? other$issueDate != null : !this$issueDate.equals(other$issueDate)) return false;
            final Object this$dueDate = this.getDueDate();
            final Object other$dueDate = other.getDueDate();
            if (this$dueDate == null ? other$dueDate != null : !this$dueDate.equals(other$dueDate)) return false;
            final Object this$returnDate = this.getReturnDate();
            final Object other$returnDate = other.getReturnDate();
            if (this$returnDate == null ? other$returnDate != null : !this$returnDate.equals(other$returnDate)) return false;
            final Object this$fine = this.getFine();
            final Object other$fine = other.getFine();
            if (this$fine == null ? other$fine != null : !this$fine.equals(other$fine)) return false;
            final Object this$status = this.getStatus();
            final Object other$status = other.getStatus();
            if (this$status == null ? other$status != null : !this$status.equals(other$status)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof LibraryDTOs.BookIssueResponse;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $id = this.getId();
            result = result * PRIME + ($id == null ? 43 : $id.hashCode());
            final Object $bookId = this.getBookId();
            result = result * PRIME + ($bookId == null ? 43 : $bookId.hashCode());
            final Object $studentId = this.getStudentId();
            result = result * PRIME + ($studentId == null ? 43 : $studentId.hashCode());
            final Object $bookTitle = this.getBookTitle();
            result = result * PRIME + ($bookTitle == null ? 43 : $bookTitle.hashCode());
            final Object $studentName = this.getStudentName();
            result = result * PRIME + ($studentName == null ? 43 : $studentName.hashCode());
            final Object $issueDate = this.getIssueDate();
            result = result * PRIME + ($issueDate == null ? 43 : $issueDate.hashCode());
            final Object $dueDate = this.getDueDate();
            result = result * PRIME + ($dueDate == null ? 43 : $dueDate.hashCode());
            final Object $returnDate = this.getReturnDate();
            result = result * PRIME + ($returnDate == null ? 43 : $returnDate.hashCode());
            final Object $fine = this.getFine();
            result = result * PRIME + ($fine == null ? 43 : $fine.hashCode());
            final Object $status = this.getStatus();
            result = result * PRIME + ($status == null ? 43 : $status.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "LibraryDTOs.BookIssueResponse(id=" + this.getId() + ", bookId=" + this.getBookId() + ", bookTitle=" + this.getBookTitle() + ", studentId=" + this.getStudentId() + ", studentName=" + this.getStudentName() + ", issueDate=" + this.getIssueDate() + ", dueDate=" + this.getDueDate() + ", returnDate=" + this.getReturnDate() + ", fine=" + this.getFine() + ", status=" + this.getStatus() + ")";
        }

        public BookIssueResponse() {
        }

        public BookIssueResponse(final Long id, final Long bookId, final String bookTitle, final Long studentId, final String studentName, final String issueDate, final String dueDate, final String returnDate, final BigDecimal fine, final String status) {
            this.id = id;
            this.bookId = bookId;
            this.bookTitle = bookTitle;
            this.studentId = studentId;
            this.studentName = studentName;
            this.issueDate = issueDate;
            this.dueDate = dueDate;
            this.returnDate = returnDate;
            this.fine = fine;
            this.status = status;
        }
    }
}
