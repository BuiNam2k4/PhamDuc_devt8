package com.idai.gian_lan.repository;

import com.idai.gian_lan.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, String> {

    Optional<Room> findByRoomCode(String roomCode);

    boolean existsByRoomCode(String roomCode);
}
