// =============================================================================
// ARCHIVO: RestaurantEndpoints.js
// EJERCICIO: Usado en TODOS los ejercicios (base de llamadas a la API)
// =============================================================================
//
// ¿QUÉ HACE ESTE ARCHIVO?
// ------------------------
// Define todas las funciones que hacen peticiones HTTP al backend
// relacionadas con restaurantes y horarios. Utiliza los helpers
// get/post/put/destroy que ya están implementados en ApiRequestsHelper.js
//
// PATRÓN GENERAL:
//   get(ruta)         → GET /ruta
//   post(ruta, data)  → POST /ruta con body JSON
//   put(ruta, data)   → PUT /ruta con body JSON
//   destroy(ruta)     → DELETE /ruta
//
// =============================================================================

import { get, post, put, destroy } from './helpers/ApiRequestsHelper'

// --- Funciones ya existentes (NO modificadas) ---

const getAll = () => {
  return get('users/myrestaurants')
}

const getDetail = (id) => {
  return get(`restaurants/${id}`)
}

const getRestaurantCategories = () => {
  return get('restaurantCategories')
}

const create = (data) => {
  return post('restaurants', data)
}

const update = (id, data) => {
  return put(`restaurants/${id}`, data)
}

const remove = (id) => {
  return destroy(`restaurants/${id}`)
}

// --- SOLUCIÓN: Funciones añadidas para Schedules ---

// SOLUCIÓN – RF.02, RF.03, RF.05, RF.06
// Obtiene TODOS los horarios de un restaurante (array de schedules,
// cada uno incluye su lista de productos asociados).
// Endpoint: GET /restaurants/:id/schedules
const getRestaurantSchedules = (id) => {
  return get(`/restaurants/${id}/schedules`)
}

// SOLUCIÓN – RF.05 (EditScheduleScreen necesita cargar UN horario concreto)
//
// ⚠️ TRUCO IMPORTANTE DE EXAMEN:
// El backend NO tiene endpoint GET /restaurants/:id/schedules/:scheduleId
// (solo existe el PUT y DELETE para un schedule concreto).
// Por tanto, para obtener un único schedule se hace:
//   1. Traer TODOS los schedules del restaurante (getRestaurantSchedules)
//   2. Filtrar con .find() el que tenga el scheduleId buscado
//
// Nota: es async porque await getRestaurantSchedules devuelve una Promise.
const getRestaurantSchedule = async (restaurantId, scheduleId) => {
  return (await getRestaurantSchedules(restaurantId)).find(schedule => schedule.id === scheduleId)
}

// SOLUCIÓN – RF.04 (ya proporcionado, pero se exporta aquí)
// Crea un nuevo schedule para un restaurante.
// Endpoint: POST /restaurants/:restaurantId/schedules
// Body: { startTime: 'HH:mm:ss', endTime: 'HH:mm:ss' }
const createSchedule = (restaurantId, data) => {
  return post(`/restaurants/${restaurantId}/schedules`, data)
}

// SOLUCIÓN – RF.05
// Actualiza un schedule existente.
// Endpoint: PUT /restaurants/:restaurantId/schedules/:scheduleId
// Body: { startTime: 'HH:mm:ss', endTime: 'HH:mm:ss' }
const updateSchedule = (restaurantId, scheduleId, data) => {
  return put(`/restaurants/${restaurantId}/schedules/${scheduleId}`, data)
}

// SOLUCIÓN – RF.03
// Elimina un schedule.
// Endpoint: DELETE /restaurants/:restaurantId/schedules/:scheduleId
const removeSchedule = (restaurantId, scheduleId) => {
  return destroy(`/restaurants/${restaurantId}/schedules/${scheduleId}`)
}

// =============================================================================
// EXPORTACIONES – todo lo que usan las screens
// =============================================================================
export {
  getAll,
  getDetail,
  getRestaurantCategories,
  create,
  update,
  remove,
  // SOLUCIÓN:
  getRestaurantSchedules,   // RF.02, RF.03, RF.05, RF.06
  createSchedule,           // RF.04
  updateSchedule,           // RF.05
  removeSchedule,           // RF.03
  getRestaurantSchedule     // RF.05
}
