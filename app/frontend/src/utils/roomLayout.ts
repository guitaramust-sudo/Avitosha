import type { RoomItemCode } from '../types/game'

export interface RoomPosition {
  x: number
  y: number
}

const roomPositionByKey: Record<string, RoomPosition> = {
  box: { x: 18, y: 72 },
  desk: { x: 10, y: 60 },
  lamp: { x: 22, y: 36 },
  chair: { x: 85, y: 66 },
  plant: { x: 92, y: 78 },
  poster: { x: 75, y: 25 },
  'piggy-bank': { x: 68, y: 75 },
  'toy-car': { x: 36, y: 83 },
  suitcase: { x: 92, y: 50 },
}

export const roomItemIcons: Record<RoomItemCode, string> = {
  BOX: '▣',
  DESK: '▰',
  LAMP: '◉',
  CHAIR: '♨',
  PLANT: '♣',
  POSTER: '▤',
  PIGGY_BANK: '◍',
  TOY_CAR: '▱',
  SUITCASE: '▥',
}

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value))

export const clampRoomPosition = (position: RoomPosition): RoomPosition => ({
  x: clamp(position.x, 6, 94),
  y: clamp(position.y, 12, 88),
})

export const getDefaultRoomPosition = (
  positionKey: string,
  index = 0,
): RoomPosition => {
  const predefinedPosition = roomPositionByKey[positionKey]

  if (predefinedPosition) {
    return { ...predefinedPosition }
  }

  return clampRoomPosition({
    x: 14 + (index % 5) * 18,
    y: 32 + Math.floor(index / 5) * 28,
  })
}
