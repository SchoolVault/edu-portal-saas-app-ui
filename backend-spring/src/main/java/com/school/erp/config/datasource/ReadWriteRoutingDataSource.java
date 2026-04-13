package com.school.erp.config.datasource;

import org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Routes to the read pool when the current Spring transaction is marked {@code readOnly=true};
 * otherwise uses the primary (write) pool. Opt-in per service method via
 * {@code @Transactional(readOnly = true)}.
 */
public class ReadWriteRoutingDataSource extends AbstractRoutingDataSource {

    public static final String WRITE = "write";
    public static final String READ = "read";

    @Override
    protected Object determineCurrentLookupKey() {
        return TransactionSynchronizationManager.isCurrentTransactionReadOnly() ? READ : WRITE;
    }
}
