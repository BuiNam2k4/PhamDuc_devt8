package com.idai.gian_lan.mapper;

import com.idai.gian_lan.dto.request.SubjectCreationRequest;
import com.idai.gian_lan.dto.request.SubjectUpdateRequest;
import com.idai.gian_lan.dto.response.SubjectResponse;
import com.idai.gian_lan.entity.Subject;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface SubjectMapper {

    Subject toSubject(SubjectCreationRequest request);

    SubjectResponse toSubjectResponse(Subject subject);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateSubject(@MappingTarget Subject subject, SubjectUpdateRequest request);
}
