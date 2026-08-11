package com.idai.gian_lan.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "subjects")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Subject {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @jakarta.persistence.Column(name = "subject_code", unique = true, nullable = false)
    String subjectCode;

    String name;
    int credits;
    String department;
}
