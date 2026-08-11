package com.idai.gian_lan.service.impl;

import com.idai.gian_lan.dto.request.RoomCreationRequest;
import com.idai.gian_lan.dto.request.RoomUpdateRequest;
import com.idai.gian_lan.dto.response.RoomResponse;
import com.idai.gian_lan.entity.Room;
import com.idai.gian_lan.exception.AppException;
import com.idai.gian_lan.exception.ErrorCode;
import com.idai.gian_lan.mapper.RoomMapper;
import com.idai.gian_lan.repository.RoomRepository;
import com.idai.gian_lan.service.RoomService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RoomServiceImpl implements RoomService {

    RoomRepository roomRepository;
    RoomMapper roomMapper;

    @Override
    public RoomResponse createRoom(RoomCreationRequest request) {
        if (roomRepository.existsByRoomCode(request.getRoomCode())) {
            throw new AppException(ErrorCode.ROOM_EXISTED);
        }

        Room room = roomMapper.toRoom(request);
        Room savedRoom = roomRepository.save(room);
        return roomMapper.toRoomResponse(savedRoom);
    }

    @Override
    public List<RoomResponse> getAllRooms() {
        return roomRepository.findAll().stream()
                .map(roomMapper::toRoomResponse)
                .collect(Collectors.toList());
    }

    @Override
    public RoomResponse getRoomById(String id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ROOM_NOT_EXISTED));
        return roomMapper.toRoomResponse(room);
    }

    @Override
    public RoomResponse getRoomByCode(String roomCode) {
        Room room = roomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new AppException(ErrorCode.ROOM_NOT_EXISTED));
        return roomMapper.toRoomResponse(room);
    }

    @Override
    public RoomResponse updateRoom(String id, RoomUpdateRequest request) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ROOM_NOT_EXISTED));

        roomMapper.updateRoom(room, request);
        Room updatedRoom = roomRepository.save(room);
        return roomMapper.toRoomResponse(updatedRoom);
    }

    @Override
    public void deleteRoom(String id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ROOM_NOT_EXISTED));
        roomRepository.delete(room);
    }
}
