package com.idai.gian_lan.mapper;

import com.idai.gian_lan.dto.request.ModelCreationRequest;
import com.idai.gian_lan.dto.response.ModelResponse;
import com.idai.gian_lan.entity.ModelStatistic;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ModelMapper {

    ModelStatistic toModelStatistic(ModelCreationRequest request);

    ModelResponse toModelResponse(ModelStatistic modelStatistic);
}
