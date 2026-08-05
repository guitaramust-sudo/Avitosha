import armchairImage from '../../images/room-items/armchair.png'
import boxImage from '../../images/room-items/box.png'
import carImage from '../../images/room-items/car.png'
import caseImage from '../../images/room-items/case.png'
import posterImage from '../../images/room-items/image.png'
import lampImage from '../../images/room-items/lamp.png'
import nightstandImage from '../../images/room-items/nightstand.png'
import piggyBankImage from '../../images/room-items/piggy_bank.png'
import plantImage from '../../images/room-items/plant.png'
import type { RoomItemCode } from '../types/game'

export interface RoomPosition {
  x: number
  y: number
}

const roomPositionByKey: Record<string, RoomPosition> = {
  box: { x: 72, y: 80 },
  desk: { x: 10, y: 72 },
  lamp: { x: 7, y: 48 },
  chair: { x: 82, y: 72 },
  plant: { x: 92, y: 57 },
  poster: { x: 39, y: 16 },
  'piggy-bank': { x: 62, y: 79 },
  'toy-car': { x: 86, y: 83 },
  suitcase: { x: 93, y: 75 },
}

export const roomItemStageWidths: Record<RoomItemCode, number> = {
  BOX: 150,
  DESK: 155,
  LAMP: 105,
  CHAIR: 210,
  PLANT: 125,
  POSTER: 90,
  PIGGY_BANK: 105,
  TOY_CAR: 125,
  SUITCASE: 145,
}

export const roomItemImages: Record<RoomItemCode, string> = {
  BOX: boxImage,
  DESK: nightstandImage,
  LAMP: lampImage,
  CHAIR: armchairImage,
  PLANT: plantImage,
  POSTER: posterImage,
  PIGGY_BANK: piggyBankImage,
  TOY_CAR: carImage,
  SUITCASE: caseImage,
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
