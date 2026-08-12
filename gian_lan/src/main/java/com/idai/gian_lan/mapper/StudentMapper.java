package com.idai.gian_lan.mapper;

import com.idai.gian_lan.dto.request.StudentCreationRequest;
import com.idai.gian_lan.dto.request.StudentUpdateRequest;
import com.idai.gian_lan.dto.response.StudentResponse;
import com.idai.gian_lan.entity.Student;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface StudentMapper {

    Student toStudent(StudentCreationRequest request);

    @Mapping(target = "username", source = "user.username")
    @Mapping(target = "role", source = "user.role")
    @Mapping(target = "fullName", source = "user.fullName")
    @Mapping(target = "email", source = "user.email")
    StudentResponse toStudentResponse(Student student);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateStudent(@MappingTarget Student student, StudentUpdateRequest request);
}
