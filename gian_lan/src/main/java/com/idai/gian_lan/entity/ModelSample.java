package com.idai.gian_lan.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "model_samples")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ModelSample {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    String type;

    @ManyToOne
    @JoinColumn(name = "sample_id")
    Sample sample;

    @ManyToOne
    @JoinColumn(name = "model_id")
    Model model;
}
