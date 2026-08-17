package com.idai.gian_lan.mapper;

import com.idai.gian_lan.dto.request.ExamSessionCreationRequest;
import com.idai.gian_lan.dto.request.ExamSessionUpdateRequest;
import com.idai.gian_lan.dto.response.ExamSessionDetailResponse;
import com.idai.gian_lan.dto.response.ExamSessionResponse;
import com.idai.gian_lan.entity.ExamSession;
import com.idai.gian_lan.entity.ExamSessionDetail;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", uses = {RoomMapper.class, SubjectMapper.class, StudentMapper.class, ModelMapper.class})
public interface ExamSessionMapper {

    @Mapping(target = "room", ignore = true)
    @Mapping(target = "subject", ignore = true)
    @Mapping(target = "model", ignore = true)
    @Mapping(target = "examSessionDetails", ignore = true)
    ExamSession toExamSession(ExamSessionCreationRequest request);

    ExamSessionResponse toExamSessionResponse(ExamSession examSession);

    ExamSessionDetailResponse toExamSessionDetailResponse(ExamSessionDetail examSessionDetail);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "room", ignore = true)
    @Mapping(target = "subject", ignore = true)
    @Mapping(target = "model", ignore = true)
    void updateExamSession(@MappingTarget ExamSession examSession, ExamSessionUpdateRequest request);
}
