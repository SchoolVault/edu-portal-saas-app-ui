package com.school.erp.tenant.hibernate;

import jakarta.persistence.EntityManager;
import org.hibernate.Session;
import org.springframework.orm.jpa.EntityManagerHolder;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Enables {@link TenantScopedFilter} when a JPA transaction begins, using {@link com.school.erp.tenant.TenantContext}.
 * Runs after the {@link EntityManager} is bound so {@link Session} is available.
 */
public class TenantAwareJpaTransactionManager extends JpaTransactionManager {

    @Override
    protected void doBegin(Object transaction, org.springframework.transaction.TransactionDefinition definition) {
        super.doBegin(transaction, definition);
        EntityManagerHolder holder = (EntityManagerHolder) TransactionSynchronizationManager.getResource(getEntityManagerFactory());
        if (holder == null) {
            return;
        }
        EntityManager em = holder.getEntityManager();
        if (em == null) {
            return;
        }
        Session session = em.unwrap(Session.class);
        TenantHibernateFilterSupport.enableTenantFilterIfNeeded(session);
    }
}
