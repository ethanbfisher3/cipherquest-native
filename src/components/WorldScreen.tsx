import React, { useEffect, useRef, useState } from "react";
import {
  ImageBackground,
  PanResponder,
  Pressable,
  Text,
  View,
  Image,
} from "react-native";
import { COUNTRIES } from "../constants";
import { appStyles as styles } from "./appStyles";
import { Header } from "./Header";

// Helper function to calculate distance between two fingers
const getTouchDistance = (touches: any[]) => {
  if (!touches || touches.length < 2) return 0;
  const [a, b] = touches;
  return Math.hypot(Math.abs(a.pageX - b.pageX), Math.abs(a.pageY - b.pageY));
};

export function WorldScreen({
  onSelectCountry,
  onBack,
}: {
  onSelectCountry: (id: string) => void;
  onBack: () => void;
}) {
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(
    null,
  );
  const [mapOffset, setMapOffset] = useState({ x: -175, y: 0 });
  const [actualMapSize, setActualMapSize] = useState({ width: 0, height: 0 });
  const [mapZoom, setMapZoom] = useState(0.25);

  const MIN_ZOOM = 0.25;
  const MAX_ZOOM = 1.5;

  const zoomRef = useRef(mapZoom);
  const shellSizeRef = useRef({ width: 0, height: 0 });
  const mapOffsetRef = useRef({ x: -175, y: 0 });

  // Container measurement refs
  const shellViewRef = useRef<View>(null);
  const shellPosRef = useRef({ pageX: 0, pageY: 0 });

  // Gesture tracking refs
  const dragStartRef = useRef({ x: 0, y: 0 });
  const activeTouchesRef = useRef(0);
  const initialTouchDistanceRef = useRef(0);
  const initialZoomRef = useRef(1);
  const initialPinchCenterRef = useRef({ x: 0, y: 0 });
  const initialMapOffsetRef = useRef({ x: -175, y: 0 });
  const momentumFrameRef = useRef<number | null>(null);

  const MAP_IMAGE = require("../../assets/map_without_names.jpg");
  const { width: MAP_WIDTH, height: MAP_HEIGHT } =
    Image.resolveAssetSource(MAP_IMAGE);

  // Helper to find the center of the pinch relative to the map shell
  const getPinchCenter = (touches: any[]) => {
    if (!touches || touches.length < 2) return { x: 0, y: 0 };
    const { pageX, pageY } = shellPosRef.current;
    return {
      x: (touches[0].pageX + touches[1].pageX) / 2 - pageX,
      y: (touches[0].pageY + touches[1].pageY) / 2 - pageY,
    };
  };

  useEffect(() => {
    zoomRef.current = mapZoom;
    const clamped = clampOffset(mapOffsetRef.current.x, mapOffsetRef.current.y);
    mapOffsetRef.current = clamped;
    setMapOffset(clamped);
  }, [mapZoom]);

  const selectedCountry =
    COUNTRIES.find((c) => c.id === selectedCountryId) || null;

  const clampOffset = (x: number, y: number) => {
    const shellW = shellSizeRef.current.width;
    const shellH = shellSizeRef.current.height;

    const currentZoom = zoomRef.current;
    const mapW = MAP_WIDTH * currentZoom;
    const mapH = MAP_HEIGHT * currentZoom;

    let minX = shellW - mapW;
    let maxX = 0;
    let minY = shellH - mapH;
    let maxY = 0;

    if (mapW <= shellW) {
      const centerX = (shellW - mapW) / 2;
      minX = maxX = centerX;
    }
    if (mapH <= shellH) {
      const centerY = (shellH - mapH) / 2;
      minY = maxY = centerY;
    }

    return {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y)),
    };
  };

  const setOffset = (x: number, y: number) => {
    const clamped = clampOffset(x, y);
    mapOffsetRef.current = clamped;
    setMapOffset(clamped);
    return clamped;
  };

  const stopMomentum = () => {
    if (momentumFrameRef.current !== null) {
      cancelAnimationFrame(momentumFrameRef.current);
      momentumFrameRef.current = null;
    }
  };

  const startMomentum = (vx: number, vy: number) => {
    stopMomentum();
    let velocityX = vx * 22;
    let velocityY = vy * 22;

    const step = () => {
      const current = mapOffsetRef.current;
      const next = setOffset(current.x + velocityX, current.y + velocityY);

      const hitXBound = next.x !== current.x + velocityX;
      const hitYBound = next.y !== current.y + velocityY;

      velocityX = hitXBound ? 0 : velocityX * 0.92;
      velocityY = hitYBound ? 0 : velocityY * 0.92;

      if (Math.abs(velocityX) < 0.08 && Math.abs(velocityY) < 0.08) {
        stopMomentum();
        return;
      }

      momentumFrameRef.current = requestAnimationFrame(step);
    };

    momentumFrameRef.current = requestAnimationFrame(step);
  };

  useEffect(() => () => stopMomentum(), []);

  // ----------------------
  // PanResponder
  // ----------------------
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,

      onPanResponderGrant: (evt) => {
        stopMomentum();
        const touches = evt.nativeEvent.touches;
        activeTouchesRef.current = touches.length;

        if (touches.length >= 2) {
          initialTouchDistanceRef.current = getTouchDistance(touches);
          initialZoomRef.current = zoomRef.current;
          initialPinchCenterRef.current = getPinchCenter(touches);
          initialMapOffsetRef.current = mapOffsetRef.current;
        } else {
          dragStartRef.current = mapOffsetRef.current;
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;

        if (touches.length !== activeTouchesRef.current) {
          activeTouchesRef.current = touches.length;

          if (touches.length === 1) {
            dragStartRef.current = {
              x: mapOffsetRef.current.x - gestureState.dx,
              y: mapOffsetRef.current.y - gestureState.dy,
            };
          } else if (touches.length >= 2) {
            initialTouchDistanceRef.current = getTouchDistance(touches);
            initialZoomRef.current = zoomRef.current;
            initialPinchCenterRef.current = getPinchCenter(touches);
            initialMapOffsetRef.current = mapOffsetRef.current;
          }
        }

        if (touches.length >= 2) {
          // --- ZOOMING ---
          const currentDistance = getTouchDistance(touches);
          if (initialTouchDistanceRef.current > 0) {
            const scale = currentDistance / initialTouchDistanceRef.current;
            let newZoom = initialZoomRef.current * scale;
            newZoom = Math.max(MIN_ZOOM, Math.min(newZoom, MAX_ZOOM));

            // Calculate the math needed to keep the zoom centered on the fingers
            const currentPinchCenter = getPinchCenter(touches);
            const zoomRatio = newZoom / initialZoomRef.current;

            const newOffsetX =
              currentPinchCenter.x -
              (initialPinchCenterRef.current.x -
                initialMapOffsetRef.current.x) *
                zoomRatio;
            const newOffsetY =
              currentPinchCenter.y -
              (initialPinchCenterRef.current.y -
                initialMapOffsetRef.current.y) *
                zoomRatio;

            // We MUST update the zoomRef before calling setOffset so the boundary clamp uses the new size!
            zoomRef.current = newZoom;
            setMapZoom(newZoom);
            setOffset(newOffsetX, newOffsetY);
          }
        } else if (touches.length === 1) {
          // --- PANNING ---
          setOffset(
            dragStartRef.current.x + gestureState.dx,
            dragStartRef.current.y + gestureState.dy,
          );
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (activeTouchesRef.current === 1) {
          startMomentum(gestureState.vx, gestureState.vy);
        }
        activeTouchesRef.current = 0;
      },
      onPanResponderTerminate: () => {
        stopMomentum();
        activeTouchesRef.current = 0;
      },
    }),
  ).current;

  // ----------------------
  // Scale factors for markers
  // ----------------------
  const scaleX = actualMapSize.width / MAP_WIDTH;
  const scaleY = actualMapSize.height / MAP_HEIGHT;

  return (
    <View style={styles.topScreenPad}>
      <Header title="World Map" onBack={onBack} />

      <View
        ref={shellViewRef}
        style={styles.mapShell}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          shellSizeRef.current = { width, height };

          // Measure the absolute position of the shell on the screen so our focal math is perfectly accurate
          setTimeout(() => {
            shellViewRef.current?.measure((x, y, w, h, pageX, pageY) => {
              shellPosRef.current = { pageX, pageY };
            });
          }, 0);

          const clamped = clampOffset(
            mapOffsetRef.current.x,
            mapOffsetRef.current.y,
          );
          mapOffsetRef.current = clamped;
          setMapOffset(clamped);
        }}
        {...panResponder.panHandlers}
      >
        <View
          style={[
            styles.mapCanvas,
            {
              width: MAP_WIDTH * mapZoom,
              height: MAP_HEIGHT * mapZoom,
              transform: [
                { translateX: mapOffset.x },
                { translateY: mapOffset.y },
              ],
            },
          ]}
        >
          <ImageBackground
            source={MAP_IMAGE}
            style={{ width: "100%", height: "100%" }}
            resizeMode="contain"
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout;
              setActualMapSize({ width, height });
            }}
          >
            {COUNTRIES.map((country) => {
              const isSelected = country.id === selectedCountryId;
              return (
                <Pressable
                  key={country.id}
                  style={[
                    styles.mapMarker,
                    {
                      left: country.x * scaleX,
                      top: country.y * scaleY,
                      backgroundColor: country.color,
                    },
                    isSelected && styles.mapMarkerSelected,
                  ]}
                  onPress={() => setSelectedCountryId(country.id)}
                >
                  <Text style={styles.mapMarkerLabel}>{country.name}</Text>
                </Pressable>
              );
            })}

            {selectedCountry && (
              <View style={styles.mapSelectedBanner}>
                <Text style={styles.mapSelectedText}>
                  {selectedCountry.name}
                </Text>
              </View>
            )}
          </ImageBackground>
        </View>
      </View>

      {selectedCountry ? (
        <Pressable
          style={styles.mapCountryCard}
          onPress={() => onSelectCountry(selectedCountry.id)}
        >
          <Text style={styles.cardTitle}>{selectedCountry.name}</Text>
          <Text style={styles.muted}>
            {selectedCountry.capital} • Threat: {selectedCountry.threatLevel}
          </Text>
          <Text style={styles.body}>{selectedCountry.description}</Text>
          <Text style={styles.mapEnterText}>Tap to enter country missions</Text>
        </Pressable>
      ) : (
        <Text style={styles.mapHelpText}>
          Pinch to zoom, drag to pan. Tap a country marker to inspect it.
        </Text>
      )}
    </View>
  );
}
