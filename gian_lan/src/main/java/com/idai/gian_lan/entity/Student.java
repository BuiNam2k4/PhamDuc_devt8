package com.idai.gian_lan.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "students")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Student extends User {

    @Column(name = "student_code", unique = true, nullable = false)
    String studentCode;

    String className;
    String avatarUrl;

    @Column(columnDefinition = "TEXT")
    String faceEmbedding;
}
