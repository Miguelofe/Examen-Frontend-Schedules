// =============================================================================
// ARCHIVO: RestaurantsStack.js
// EJERCICIO: Ejercicio 2, 4 y 5 (navegación entre pantallas nuevas)
// =============================================================================
//
// ¿QUÉ HACE ESTE ARCHIVO?
// ------------------------
// Define el STACK de navegación de la sección "Restaurants" de la app.
// Cada <Stack.Screen> registra una pantalla con un nombre (name) que se
// usará en navigation.navigate('NombrePantalla', { params }).
//
// SOLUCIÓN APLICADA:
// ------------------
// Se añaden 3 nuevas pantallas al stack que no existían:
//   • RestaurantSchedulesScreen  → listado y gestión de horarios (Ej 2 y 3)
//   • CreateScheduleScreen       → crear horario (Ej RF.04, ya proporcionado)
//   • EditScheduleScreen         → editar horario (Ej 4)
//
// ⚠️ REGLA DE EXAMEN: Si creas una nueva Screen y no la registras aquí,
// navigation.navigate('NombrePantalla') lanzará un error en tiempo de ejecución.
// =============================================================================

import { createNativeStackNavigator } from '@react-navigation/native-stack'
import React from 'react'
import CreateProductScreen from './CreateProductScreen'
import CreateRestaurantScreen from './CreateRestaurantScreen'
import EditProductScreen from './EditProductScreen'
import EditRestaurantScreen from './EditRestaurantScreen'
import RestaurantDetailScreen from './RestaurantDetailScreen'
import RestaurantsScreen from './RestaurantsScreen'
// SOLUCIÓN: importamos las nuevas screens de horarios
import RestaurantSchedulesScreen from './RestaurantSchedulesScreen'
import CreateScheduleScreen from './CreateScheduleScreen'
import EditScheduleScreen from './EditScheduleScreen'

const Stack = createNativeStackNavigator()

export default function RestaurantsStack () {
  return (
    <Stack.Navigator>
      {/* Pantallas ya existentes (sin modificar) */}
      <Stack.Screen
        name='RestaurantsScreen'
        component={RestaurantsScreen}
        options={{ title: 'My Restaurants' }} />
      <Stack.Screen
        name='RestaurantDetailScreen'
        component={RestaurantDetailScreen}
        options={{ title: 'Restaurant Detail' }} />
      <Stack.Screen
        name='CreateRestaurantScreen'
        component={CreateRestaurantScreen}
        options={{ title: 'Create Restaurant' }} />
      <Stack.Screen
        name='CreateProductScreen'
        component={CreateProductScreen}
        options={{ title: 'Create Product' }} />
      <Stack.Screen
        name='EditRestaurantScreen'
        component={EditRestaurantScreen}
        options={{ title: 'Edit Restaurant' }} />
      <Stack.Screen
        name='EditProductScreen'
        component={EditProductScreen}
        options={{ title: 'Edit Product' }} />

      {/* SOLUCIÓN: nuevas pantallas de gestión de horarios */}
      <Stack.Screen
        name='RestaurantSchedulesScreen'       // usado en: navigation.navigate('RestaurantSchedulesScreen', { id: restaurant.id })
        component={RestaurantSchedulesScreen}
        options={{ title: 'Schedules' }} />
      <Stack.Screen
        name='CreateScheduleScreen'            // usado en: navigation.navigate('CreateScheduleScreen', { id: restaurantId })
        component={CreateScheduleScreen}
        options={{ title: 'Create Schedule' }} />
      <Stack.Screen
        name='EditScheduleScreen'              // usado en: navigation.navigate('EditScheduleScreen', { scheduleId, restaurantId })
        component={EditScheduleScreen}
        options={{ title: 'Edit Schedule' }} />
    </Stack.Navigator>
  )
}
