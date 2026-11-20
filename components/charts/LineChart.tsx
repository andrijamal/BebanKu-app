import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Svg, {
  Path,
  Circle,
  Text as SvgText,
  Line,
  Defs,
  LinearGradient,
  Stop,
  G,
  Rect,
} from 'react-native-svg';
import { Colors } from '../../constants/Colors';

export interface DataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
  date?: string;
  note?: string;
}

interface LineChartProps {
  data: DataPoint[];
  color?: string;
  secondaryColor?: string;
  unit?: string;
  height?: number;
  showSecondary?: boolean;
  secondaryLabel?: string;
  primaryLabel?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  color = Colors.primary,
  secondaryColor = '#38BDF8',
  unit = 'kg',
  height = 200,
  showSecondary = false,
  primaryLabel = 'Max',
  secondaryLabel = '1RM',
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(
    data.length > 0 ? data.length - 1 : null
  );

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = Math.max(screenWidth - 64, 300);
  const chartHeight = height;

  const paddingTop = 30;
  const paddingBottom = 30;
  const paddingLeft = 45;
  const paddingRight = 20;

  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  if (data.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <Text style={styles.emptyText}>Tidak ada data untuk ditampilkan</Text>
      </View>
    );
  }

  // Calculate min & max values
  const primaryValues = data.map((d) => d.value);
  const secondaryValues = showSecondary ? data.map((d) => d.secondaryValue || 0) : [];
  const allValues = [...primaryValues, ...secondaryValues].filter((v) => v > 0);

  const rawMin = allValues.length > 0 ? Math.min(...allValues) : 0;
  const rawMax = allValues.length > 0 ? Math.max(...allValues) : 100;

  // Add buffer to min and max for aesthetic spacing
  const buffer = Math.max((rawMax - rawMin) * 0.15, 2);
  const minValue = Math.max(0, Math.floor(rawMin - buffer));
  const maxValue = Math.ceil(rawMax + buffer);
  const range = maxValue - minValue || 1;

  // Compute point coordinates
  const getX = (index: number) => {
    if (data.length === 1) return paddingLeft + plotWidth / 2;
    return paddingLeft + (index / (data.length - 1)) * plotWidth;
  };

  const getY = (val: number) => {
    return paddingTop + plotHeight - ((val - minValue) / range) * plotHeight;
  };

  // Generate SVG Path for line
  const createPath = (values: number[]) => {
    if (values.length === 0) return '';
    return values
      .map((val, idx) => {
        const x = getX(idx);
        const y = getY(val);
        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  // Generate Area Fill Path
  const createAreaPath = (values: number[]) => {
    if (values.length === 0) return '';
    const linePath = createPath(values);
    const startX = getX(0);
    const endX = getX(values.length - 1);
    const bottomY = paddingTop + plotHeight;
    return `${linePath} L ${endX} ${bottomY} L ${startX} ${bottomY} Z`;
  };

  const primaryPath = createPath(primaryValues);
  const primaryArea = createAreaPath(primaryValues);
  const secondaryPath = showSecondary ? createPath(secondaryValues) : '';

  // Y-axis grid levels (4 horizontal lines)
  const gridLevels = 4;
  const gridLines = Array.from({ length: gridLevels }).map((_, i) => {
    const val = Math.round(minValue + (range / (gridLevels - 1)) * i);
    const y = getY(val);
    return { val, y };
  });

  const selectedPoint = selectedIndex !== null ? data[selectedIndex] : null;

  return (
    <View style={styles.cardContainer}>
      {/* Selected Point Tooltip / Header */}
      {selectedPoint && (
        <View style={styles.tooltipContainer}>
          <View style={styles.tooltipLeft}>
            <Text style={styles.tooltipDate}>{selectedPoint.date || selectedPoint.label}</Text>
            {selectedPoint.note ? (
              <Text style={styles.tooltipNote} numberOfLines={1}>
                {selectedPoint.note}
              </Text>
            ) : null}
          </View>
          <View style={styles.tooltipRight}>
            <View style={styles.valPill}>
              <View style={[styles.valDot, { backgroundColor: color }]} />
              <Text style={styles.valText}>
                {selectedPoint.value} {unit}
              </Text>
            </View>
            {showSecondary && selectedPoint.secondaryValue && (
              <View style={[styles.valPill, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                <View style={[styles.valDot, { backgroundColor: secondaryColor }]} />
                <Text style={[styles.valText, { color: secondaryColor }]}>
                  {selectedPoint.secondaryValue} {unit}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* SVG Chart */}
      <View style={styles.svgWrapper}>
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <LinearGradient id="gradientPrimary" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity="0.35" />
              <Stop offset="1" stopColor={color} stopOpacity="0.0" />
            </LinearGradient>
          </Defs>

          {/* Grid lines and Y-axis labels */}
          {gridLines.map((gl, i) => (
            <G key={`grid-${i}`}>
              <Line
                x1={paddingLeft}
                y1={gl.y}
                x2={chartWidth - paddingRight}
                y2={gl.y}
                stroke={Colors.borderLight}
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <SvgText
                x={paddingLeft - 8}
                y={gl.y + 4}
                fill={Colors.textDim}
                fontSize="10"
                fontWeight="600"
                textAnchor="end"
              >
                {gl.val}
              </SvgText>
            </G>
          ))}

          {/* Area under primary line */}
          <Path d={primaryArea} fill="url(#gradientPrimary)" />

          {/* Secondary Line (e.g. 1RM) */}
          {showSecondary && (
            <Path
              d={secondaryPath}
              fill="none"
              stroke={secondaryColor}
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          )}

          {/* Primary Line */}
          <Path
            d={primaryPath}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points on Primary Line */}
          {data.map((d, idx) => {
            const x = getX(idx);
            const y = getY(d.value);
            const isSelected = selectedIndex === idx;

            return (
              <G key={`pt-${idx}`}>
                {/* Visible Circle */}
                <Circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 6 : 4}
                  fill={isSelected ? '#FFFFFF' : color}
                  stroke={color}
                  strokeWidth={isSelected ? 3 : 1.5}
                />
                {/* X-axis label (spaced out) */}
                {(data.length <= 6 || idx === 0 || idx === data.length - 1 || idx % 2 === 0) && (
                  <SvgText
                    x={x}
                    y={chartHeight - 8}
                    fill={isSelected ? Colors.text : Colors.textDim}
                    fontSize="9"
                    fontWeight={isSelected ? '700' : '500'}
                    textAnchor="middle"
                  >
                    {d.label}
                  </SvgText>
                )}
              </G>
            );
          })}
        </Svg>

        {/* Touch overlay to select points without SVG responder warnings on web */}
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
              key={`touch-col-${idx}`}
              style={{ flex: 1, height: '100%' }}
              onPress={() => setSelectedIndex(idx)}
              activeOpacity={1}
            />
          ))}
        </View>
      </View>

      {/* Legend / Legend Row if secondary enabled */}
      {showSecondary && (
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendIndicator, { backgroundColor: color }]} />
            <Text style={styles.legendLabel}>{primaryLabel}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendIndicator, { backgroundColor: secondaryColor }]} />
            <Text style={styles.legendLabel}>{secondaryLabel}</Text>
          </View>
        </View>
      )}
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
  tooltipContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.backgroundDark,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  tooltipLeft: {
    flex: 1,
    marginRight: 8,
  },
  tooltipDate: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  tooltipNote: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  tooltipRight: {
    flexDirection: 'row',
    gap: 6,
  },
  valPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(190, 242, 100, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  valDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  valText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  svgWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendIndicator: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
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

