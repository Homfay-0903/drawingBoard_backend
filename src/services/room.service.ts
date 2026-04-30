import { Room } from '../models/Room'
import type { RoomData } from '../types'

export class RoomService {
  private rooms: Map<string, Room>
  private playerRoomMap: Map<string, string>

  constructor() {
    this.rooms = new Map()
    this.playerRoomMap = new Map()
  }

  createRoom(name: string, hostId: string, maxPlayers: number = 6): Room {
    const room = new Room(name, hostId, maxPlayers)
    this.rooms.set(room.id, room)
    return room
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId)
  }

  deleteRoom(roomId: string): void {
    const room = this.rooms.get(roomId)
    if (room) {
      for (const player of room.getAllPlayers()) {
        this.playerRoomMap.delete(player.id)
      }
      this.rooms.delete(roomId)
    }
  }

  getAllRooms(): Room[] {
    return Array.from(this.rooms.values())
  }

  getWaitingRooms(): Room[] {
    return this.getAllRooms().filter(room => room.status === 'waiting')
  }

  getRoomsData(): RoomData[] {
    return this.getWaitingRooms().map(room => room.toJSON())
  }

  setPlayerRoom(playerId: string, roomId: string): void {
    this.playerRoomMap.set(playerId, roomId)
  }

  removePlayerFromMap(playerId: string): void {
    this.playerRoomMap.delete(playerId)
  }

  getPlayerRoom(playerId: string): Room | undefined {
    const roomId = this.playerRoomMap.get(playerId)
    if (!roomId) return undefined
    return this.rooms.get(roomId)
  }

  getRoomBySocketId(socketId: string): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.getPlayerBySocketId(socketId)) {
        return room
      }
    }
    return undefined
  }
}

export const roomService = new RoomService()
