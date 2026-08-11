package com.idai.gian_lan.mapper;

import com.idai.gian_lan.dto.request.RoomCreationRequest;
import com.idai.gian_lan.dto.request.RoomUpdateRequest;
import com.idai.gian_lan.dto.response.RoomResponse;
import com.idai.gian_lan.entity.Room;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface RoomMapper {

    Room toRoom(RoomCreationRequest request);

    RoomResponse toRoomResponse(Room room);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateRoom(@MappingTarget Room room, RoomUpdateRequest request);
}
