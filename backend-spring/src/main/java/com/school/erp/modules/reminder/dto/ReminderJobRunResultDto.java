package com.school.erp.modules.reminder.dto;

public class ReminderJobRunResultDto {
    private int feeChannelRowsEnqueued;

    public ReminderJobRunResultDto() {}

    public ReminderJobRunResultDto(int feeChannelRowsEnqueued) {
        this.feeChannelRowsEnqueued = feeChannelRowsEnqueued;
    }

    public int getFeeChannelRowsEnqueued() {
        return feeChannelRowsEnqueued;
    }

    public void setFeeChannelRowsEnqueued(int feeChannelRowsEnqueued) {
        this.feeChannelRowsEnqueued = feeChannelRowsEnqueued;
    }
}
