package com.school.erp.common.dto;

import java.util.List;

public class PageResponse<T> {
    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean last;
    private boolean first;

    public static <T> PageResponse<T> of(List<T> content, int page, int size, long totalElements) {
        int totalPages = (int) Math.ceil((double) totalElements / size);
        return PageResponse.<T>builder().content(content).page(page).size(size).totalElements(totalElements).totalPages(totalPages).first(page == 0).last(page >= totalPages - 1).build();
    }


    public static class PageResponseBuilder<T> {
        private List<T> content;
        private int page;
        private int size;
        private long totalElements;
        private int totalPages;
        private boolean last;
        private boolean first;

        PageResponseBuilder() {
        }

        /**
         * @return {@code this}.
         */
        public PageResponse.PageResponseBuilder<T> content(final List<T> content) {
            this.content = content;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public PageResponse.PageResponseBuilder<T> page(final int page) {
            this.page = page;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public PageResponse.PageResponseBuilder<T> size(final int size) {
            this.size = size;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public PageResponse.PageResponseBuilder<T> totalElements(final long totalElements) {
            this.totalElements = totalElements;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public PageResponse.PageResponseBuilder<T> totalPages(final int totalPages) {
            this.totalPages = totalPages;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public PageResponse.PageResponseBuilder<T> last(final boolean last) {
            this.last = last;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public PageResponse.PageResponseBuilder<T> first(final boolean first) {
            this.first = first;
            return this;
        }

        public PageResponse<T> build() {
            return new PageResponse<T>(this.content, this.page, this.size, this.totalElements, this.totalPages, this.last, this.first);
        }

        @Override
        public String toString() {
            return "PageResponse.PageResponseBuilder(content=" + this.content + ", page=" + this.page + ", size=" + this.size + ", totalElements=" + this.totalElements + ", totalPages=" + this.totalPages + ", last=" + this.last + ", first=" + this.first + ")";
        }
    }

    public static <T> PageResponse.PageResponseBuilder<T> builder() {
        return new PageResponse.PageResponseBuilder<T>();
    }

    public List<T> getContent() {
        return this.content;
    }

    public int getPage() {
        return this.page;
    }

    public int getSize() {
        return this.size;
    }

    public long getTotalElements() {
        return this.totalElements;
    }

    public int getTotalPages() {
        return this.totalPages;
    }

    public boolean isLast() {
        return this.last;
    }

    public boolean isFirst() {
        return this.first;
    }

    public void setContent(final List<T> content) {
        this.content = content;
    }

    public void setPage(final int page) {
        this.page = page;
    }

    public void setSize(final int size) {
        this.size = size;
    }

    public void setTotalElements(final long totalElements) {
        this.totalElements = totalElements;
    }

    public void setTotalPages(final int totalPages) {
        this.totalPages = totalPages;
    }

    public void setLast(final boolean last) {
        this.last = last;
    }

    public void setFirst(final boolean first) {
        this.first = first;
    }

    @Override
    public boolean equals(final Object o) {
        if (o == this) return true;
        if (!(o instanceof PageResponse)) return false;
        final PageResponse<?> other = (PageResponse<?>) o;
        if (!other.canEqual((Object) this)) return false;
        if (this.getPage() != other.getPage()) return false;
        if (this.getSize() != other.getSize()) return false;
        if (this.getTotalElements() != other.getTotalElements()) return false;
        if (this.getTotalPages() != other.getTotalPages()) return false;
        if (this.isLast() != other.isLast()) return false;
        if (this.isFirst() != other.isFirst()) return false;
        final Object this$content = this.getContent();
        final Object other$content = other.getContent();
        if (this$content == null ? other$content != null : !this$content.equals(other$content)) return false;
        return true;
    }

    protected boolean canEqual(final Object other) {
        return other instanceof PageResponse;
    }

    @Override
    public int hashCode() {
        final int PRIME = 59;
        int result = 1;
        result = result * PRIME + this.getPage();
        result = result * PRIME + this.getSize();
        final long $totalElements = this.getTotalElements();
        result = result * PRIME + (int) ($totalElements >>> 32 ^ $totalElements);
        result = result * PRIME + this.getTotalPages();
        result = result * PRIME + (this.isLast() ? 79 : 97);
        result = result * PRIME + (this.isFirst() ? 79 : 97);
        final Object $content = this.getContent();
        result = result * PRIME + ($content == null ? 43 : $content.hashCode());
        return result;
    }

    @Override
    public String toString() {
        return "PageResponse(content=" + this.getContent() + ", page=" + this.getPage() + ", size=" + this.getSize() + ", totalElements=" + this.getTotalElements() + ", totalPages=" + this.getTotalPages() + ", last=" + this.isLast() + ", first=" + this.isFirst() + ")";
    }

    public PageResponse() {
    }

    public PageResponse(final List<T> content, final int page, final int size, final long totalElements, final int totalPages, final boolean last, final boolean first) {
        this.content = content;
        this.page = page;
        this.size = size;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
        this.last = last;
        this.first = first;
    }
}
