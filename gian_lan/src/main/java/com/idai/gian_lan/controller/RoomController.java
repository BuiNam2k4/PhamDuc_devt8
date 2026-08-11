package com.idai.gian_lan.controller;

import com.idai.gian_lan.dto.request.RoomCreationRequest;
import com.idai.gian_lan.dto.request.RoomUpdateRequest;
import com.idai.gian_lan.dto.response.ApiResponse;
import com.idai.gian_lan.dto.response.RoomResponse;
import com.idai.gian_lan.service.RoomService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RoomController {

    RoomService roomService;

    @PostMapping
    public ApiResponse<RoomResponse> createRoom(@RequestBody @Valid RoomCreationRequest request) {
        return ApiResponse.<RoomResponse>builder()
                .result(roomService.createRoom(request))
                .build();
    }

    @GetMapping
    public ApiResponse<List<RoomResponse>> getAllRooms() {
        return ApiResponse.<List<RoomResponse>>builder()
                .result(roomService.getAllRooms())
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<RoomResponse> getRoomById(@PathVariable String id) {
        return ApiResponse.<RoomResponse>builder()
                .result(roomService.getRoomById(id))
                .build();
    }

    @GetMapping("/code/{roomCode}")
    public ApiResponse<RoomResponse> getRoomByCode(@PathVariable String roomCode) {
        return ApiResponse.<RoomResponse>builder()
                .result(roomService.getRoomByCode(roomCode))
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<RoomResponse> updateRoom(
            @PathVariable String id,
            @RequestBody RoomUpdateRequest request) {
        return ApiResponse.<RoomResponse>builder()
                .result(roomService.updateRoom(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteRoom(@PathVariable String id) {
        roomService.deleteRoom(id);
        return ApiResponse.<String>builder()
                .result("Room has been deleted successfully")
                .build();
    }
}
