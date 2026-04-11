/**
 * Mirrors {@code com.school.erp.modules.chat.dto.ChatDirectoryDTOs}
 * (GET /api/v1/chat/directory wrapped in standard ApiResponse).
 */
export namespace ChatDirectoryDtos {
  export interface UserCard {
    userId: number;
    name: string;
    role: string;
  }

  export interface StudentCard {
    studentId: number;
    studentName: string;
    parent?: UserCard;
  }

  export interface ClassRoster {
    classId: number;
    className: string;
    sectionId: number;
    sectionName: string;
    students: StudentCard[];
  }

  export interface ParentChildRoster {
    studentId: number;
    studentName: string;
    classId: number;
    className: string;
    sectionId: number;
    sectionName: string;
    classTeacher?: UserCard;
  }

  export interface DirectoryResponse {
    myClassRosters?: ClassRoster[];
    myChildren?: ParentChildRoster[];
    teachers?: UserCard[];
    parents?: UserCard[];
  }
}
