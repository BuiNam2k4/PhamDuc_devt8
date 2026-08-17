package com.idai.gian_lan.entity;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;

/**
 * Class thống kê mô hình - KHÔNG LƯU VÀO CSDL.
 * Chỉ dùng để tính toán và hiển thị ở tầng service/controller.
 * Kế thừa từ Model entity nhưng bản thân không phải Entity.
 */
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ModelStatistic extends Model {

    int totalSamples;

    int cheatingDetections;
}
