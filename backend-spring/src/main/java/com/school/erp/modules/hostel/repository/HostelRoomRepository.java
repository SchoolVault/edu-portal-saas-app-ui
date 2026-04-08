package com.school.erp.modules.hostel.repository;
import com.school.erp.modules.hostel.entity.HostelRoom; import org.springframework.data.jpa.repository.JpaRepository; import java.util.List;
public interface HostelRoomRepository extends JpaRepository<HostelRoom, Long> { List<HostelRoom> findByTenantIdAndIsDeletedFalse(String t); }
