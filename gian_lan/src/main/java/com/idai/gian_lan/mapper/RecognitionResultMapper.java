package com.idai.gian_lan.mapper;

import com.idai.gian_lan.dto.request.RecognitionResultCreationRequest;
import com.idai.gian_lan.dto.response.RecognitionResultResponse;
import com.idai.gian_lan.entity.RecognitionResult;
import com.idai.gian_lan.dto.enums.ViolationType;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface RecognitionResultMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "model", ignore = true)
    @Mapping(target = "examSessionCamera", ignore = true)
    @Mapping(target = "examSession", ignore = true)
    @Mapping(target = "student", ignore = true)
    @Mapping(target = "violationType", expression = "java(mapStringToViolationType(request.getViolationType()))")
    RecognitionResult toRecognitionResult(RecognitionResultCreationRequest request);

    @Mapping(target = "modelId", source = "model.id")
    @Mapping(target = "modelName", source = "model.name")
    @Mapping(target = "studentUsername", source = "student.username")
    @Mapping(target = "studentFullName", source = "student.fullName")
    @Mapping(target = "examSessionCameraId", source = "examSessionCamera.id")
    @Mapping(target = "examSessionId", source = "examSession.id")
    RecognitionResultResponse toRecognitionResultResponse(RecognitionResult recognitionResult);

    default ViolationType mapStringToViolationType(String violationTypeStr) {
        if (violationTypeStr == null) {
            return ViolationType.OTHER;
        }
        try {
            return ViolationType.valueOf(violationTypeStr.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            switch (violationTypeStr.toLowerCase().trim()) {
                case "phone_detected":
                    return ViolationType.PHONE_DETECTED;
                case "look_away":
                    return ViolationType.LOOK_AWAY;
                case "multiple_faces":
                    return ViolationType.MULTIPLE_FACES;
                case "face_not_detected":
                    return ViolationType.FACE_NOT_DETECTED;
                case "suspicious_object":
                    return ViolationType.USING_DOCUMENT;
                default:
                    return ViolationType.OTHER;
            }
        }
    }
}
