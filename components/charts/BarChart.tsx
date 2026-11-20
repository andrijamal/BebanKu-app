import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Rect, Text as SvgText, Line, G } from 'react-native-svg';
import { Colors } from '../../constants/Colors';

export interface BarDataPoint {
  label: string;
  value: number;
  subLabel?: string;
}

interface BarChartProps {
  data: BarDataPoint[];
  color?: string;
  height?: number;
  unit?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  color = Colors.primary,
  height = 180,
  unit = 'sesi',
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(
    data.length > 0 ? data.length - 1 : null
  );

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = Math.max(screenWidth - 64, 300);
  const chartHeight = height;

  const paddingTop = 26;
  const paddingBottom = 30;
  const paddingLeft = 32;
  const paddingRight = 16;

  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  if (data.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <Text style={styles.emptyText}>Tidak ada data aktivitas mingguan</Text>
      </View>
    );
  }

  const values = data.map((d) => d.value);
  const maxValue = Math.max(...values, 4);

  const barCount = data.length;
  const barSlotWidth = plotWidth / barCount;
  const barWidth = Math.min(barSlotWidth * 0.55, 32);

  const selectedPoint = selectedIndex !== null ? data[selectedIndex] : null;

  return (
    <View style={styles.cardContainer}>
      {selectedPoint && (
        <View style={styles.tooltipRow}>
          <Text style={styles.tooltipLabel}>
            {selectedPoint.subLabel || selectedPoint.label}:
          </Text>
          <Text style={styles.tooltipValue}>
            {selectedPoint.value} {unit}
          </Text>
        </View>
      )}

      <View style={styles.svgWrapper}>
        <Svg width={chartWidth} height={chartHeight}>
          {/* Baseline grid */}
          <Line
            x1={paddingLeft}
            y1={paddingTop + plotHeight}
            x2={chartWidth - paddingRight}
            y2={paddingTop + plotHeight}
            stroke={Colors.borderLight}
            strokeWidth="1"
          />

          {data.map((item, idx) => {
            const barHeight = (item.value / maxValue) * plotHeight;
            const x = paddingLeft + idx * barSlotWidth + (barSlotWidth - barWidth) / 2;
            const y = paddingTop + plotHeight - barHeight;
            const isSelected = selectedIndex === idx;

            return (
              <G key={`bar-${idx}`}>
                {/* The Bar */}
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(barHeight, 4)}
                  rx={4}
                  ry={4}
                  fill={isSelected ? color : 'rgba(190, 242, 100, 0.45)'}
                />

                {/* Value number on top of bar */}
                {item.value > 0 && (
                  <SvgText
                    x={x + barWidth / 2}
                    y={y - 6}
                    fill={isSelected ? Colors.text : Colors.textMuted}
                    fontSize="10"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {item.value}
                  </SvgText>
                )}

                {/* X-axis label */}
                <SvgText
                  x={x + barWidth / 2}
                  y={chartHeight - 8}
                  fill={isSelected ? Colors.primary : Colors.textDim}
                  fontSize="10"
                  fontWeight={isSelected ? '800' : '600'}
                  textAnchor="middle"
                >
                  {item.label}
                </SvgText>
              </G>
            );
          })}
        </Svg>
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              flexDirection: 'row',
              paddingLeft,
              paddingRight,
              paddingTop,
              height: plotHeight + paddingTop,
            },
          ]}
          pointerEvents="box-none"
        >
          {data.map((_, idx) => (
            <TouchableOpacity
              key={`touch-bar-${idx}`}
              style={{ flex: 1, height: '100%' }}
              onPress={() => setSelectedIndex(idx)}
              activeOpacity={1}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 16,
  },
  tooltipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.backgroundDark,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 10,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  tooltipLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  tooltipValue: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  svgWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.borderLight,
    padding: 20,
    marginBottom: 16,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
});
