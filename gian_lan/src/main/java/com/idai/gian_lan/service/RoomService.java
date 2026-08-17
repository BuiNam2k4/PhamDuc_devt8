package com.idai.gian_lan.service;

import com.idai.gian_lan.dto.request.RoomCreationRequest;
import com.idai.gian_lan.dto.request.RoomUpdateRequest;
import com.idai.gian_lan.dto.response.RoomResponse;

import java.util.List;

public interface RoomService {

    RoomResponse createRoom(RoomCreationRequest request);

    List<RoomResponse> getAllRooms();

    RoomResponse getRoomById(String id);

    RoomResponse getRoomByCode(String roomCode);

    RoomResponse updateRoom(String id, RoomUpdateRequest request);

    void deleteRoom(String id);
}
