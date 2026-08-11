package com.idai.gian_lan.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RoomCreationRequest {

    @NotBlank(message = "Room code is required")
    String roomCode;

    @NotBlank(message = "Room name is required")
    String name;

    Integer capacity;
    String building;
    String description;
}
