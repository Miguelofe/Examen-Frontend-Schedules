// =============================================================================
// ARCHIVO: RestaurantSchedulesScreen.js
// EJERCICIO: Ejercicio 2 – RF.02 (listado de horarios con nº de productos)
//            Ejercicio 3 – RF.03 (borrado de horario con confirmación)
// =============================================================================
//
// ¿QUÉ HACE ESTA PANTALLA?
// -------------------------
// Muestra el listado de horarios de un restaurante. Para cada horario muestra:
//   • Hora de inicio (startTime)
//   • Hora de fin (endTime)
//   • Número de productos asociados (item.products.length)
//   • Botón "Edit" → navega a EditScheduleScreen
//   • Botón "Delete" → abre el modal de confirmación (DeleteModal)
//
// También tiene un botón en la cabecera para crear un nuevo schedule.
//
// PARÁMETROS DE NAVEGACIÓN QUE RECIBE:
//   route.params.id → restaurantId
//
// PATRÓN GENERAL USADO:
//   1. Estado: schedules (array), scheduleToBeDeleted (objeto o null)
//   2. useEffect → fetchSchedules() cuando cambia loggedInUser o route
//   3. FlatList con renderSchedule, renderHeader y renderEmptySchedulesList
//   4. DeleteModal controlado por scheduleToBeDeleted !== null
//
// DATOS QUE DEVUELVE EL BACKEND (GET /restaurants/:id/schedules):
//   [ { id, startTime, endTime, restaurantId, products: [...] }, ... ]
//   Cada schedule ya incluye su array de productos → usamos .length directamente.
//
// =============================================================================

/* eslint-disable react/prop-types */
import React, { useContext, useEffect, useState } from 'react'
import { StyleSheet, FlatList, Pressable, View } from 'react-native'

// SOLUCIÓN: importamos getRestaurantSchedules y removeSchedule del endpoint
import { getRestaurantSchedules, removeSchedule } from '../../api/RestaurantEndpoints'
import ImageCard from '../../components/ImageCard'
import TextSemiBold from '../../components/TextSemibold'
import TextRegular from '../../components/TextRegular'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as GlobalStyles from '../../styles/GlobalStyles'
import { AuthorizationContext } from '../../context/AuthorizationContext'
import { showMessage } from 'react-native-flash-message'
import DeleteModal from '../../components/DeleteModal'
import scheduleIcon from '../../../assets/schedule.png'

export default function RestaurantSchedulesScreen ({ navigation, route }) {
  // SOLUCIÓN: estados principales
  const [schedules, setSchedules] = useState([])           // lista de horarios
  const [scheduleToBeDeleted, setScheduleToBeDeleted] = useState(null)  // horario a borrar (null = modal oculto)
  const { loggedInUser } = useContext(AuthorizationContext)

  // SOLUCIÓN: carga inicial y recarga al volver a la pantalla
  useEffect(() => {
    if (loggedInUser) {
      fetchSchedules()
    } else {
      setSchedules([])
    }
  }, [loggedInUser, route])

  // SOLUCIÓN: renderizado de cada horario de la lista
  const renderSchedule = ({ item }) => {
    return (
      <ImageCard
        imageUri={scheduleIcon}
        title={item.name}
        onPress={() => {
          // Al pulsar la card también se puede navegar a editar
          navigation.navigate('EditScheduleScreen', { scheduleId: item.id, restaurantId: item.restaurantId })
        }}
      >
        <View>
          {/* Hora de inicio */}
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <TextSemiBold>Start Time:</TextSemiBold>
            <TextRegular textStyle={{ marginLeft: 5, color: GlobalStyles.brandGreen }}>{item.startTime}</TextRegular>
          </View>

          {/* Hora de fin */}
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <TextSemiBold>End Time:</TextSemiBold>
            <TextRegular textStyle={{ marginLeft: 5, color: GlobalStyles.brandPrimary }}>{item.endTime}</TextRegular>
          </View>

          {/* Número de productos asociados
              → item.products.length (el backend ya incluye el array products)
              → Si no hay productos: color rojo (brandPrimary)
              → Si hay productos: color verde (brandSecondary)
          */}
          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end' }}>
            <TextSemiBold textStyle={{ color: item.products.length === 0 ? GlobalStyles.brandPrimary : GlobalStyles.brandSecondary }}>
              {item.products.length} products associated
            </TextSemiBold>
          </View>
        </View>

        {/* Botones de acción: Editar y Borrar */}
        <View style={styles.actionButtonsContainer}>
          {/* Botón Editar → navega a EditScheduleScreen con scheduleId y restaurantId */}
          <Pressable
            onPress={() => navigation.navigate('EditScheduleScreen', { scheduleId: item.id, restaurantId: item.restaurantId })}
            style={({ pressed }) => [
              { backgroundColor: pressed ? GlobalStyles.brandBlueTap : GlobalStyles.brandBlue },
              styles.actionButton
            ]}>
            <View style={[{ flex: 1, flexDirection: 'row', justifyContent: 'center' }]}>
              <MaterialCommunityIcons name='pencil' color={'white'} size={20}/>
              <TextRegular textStyle={styles.text}>Edit</TextRegular>
            </View>
          </Pressable>

          {/* Botón Borrar → guarda en estado el schedule a borrar (abre el modal) */}
          <Pressable
            onPress={() => { setScheduleToBeDeleted(item) }}
            style={({ pressed }) => [
              { backgroundColor: pressed ? GlobalStyles.brandPrimaryTap : GlobalStyles.brandPrimary },
              styles.actionButton
            ]}>
            <View style={[{ flex: 1, flexDirection: 'row', justifyContent: 'center' }]}>
              <MaterialCommunityIcons name='delete' color={'white'} size={20}/>
              <TextRegular textStyle={styles.text}>Delete</TextRegular>
            </View>
          </Pressable>
        </View>
      </ImageCard>
    )
  }

  const renderEmptySchedulesList = () => {
    return (
      <TextRegular textStyle={styles.emptyList}>
        No schedules were retreived. Either you are not logged in or the restaurant has no schedules yet.
      </TextRegular>
    )
  }

  // Cabecera con botón para crear nuevo schedule
  const renderHeader = () => {
    return (
      <>
      {loggedInUser &&
        <Pressable
          onPress={() => navigation.navigate('CreateScheduleScreen', { id: route.params.id })}
          style={({ pressed }) => [
            { backgroundColor: pressed ? GlobalStyles.brandGreenTap : GlobalStyles.brandGreen },
            styles.button
          ]}>
          <View style={[{ flex: 1, flexDirection: 'row', justifyContent: 'center' }]}>
            <MaterialCommunityIcons name='plus-circle' color={'white'} size={20}/>
            <TextRegular textStyle={styles.text}>Create schedule</TextRegular>
          </View>
        </Pressable>
      }
      </>
    )
  }

  // SOLUCIÓN – Ejercicio 2 (RF.02): carga los schedules del restaurante
  const fetchSchedules = async () => {
    try {
      const fetchedSchedules = await getRestaurantSchedules(route.params.id)
      setSchedules(fetchedSchedules)
    } catch (error) {
      showMessage({
        message: `There was an error while retrieving restaurant schedules. ${error} `,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }

  // SOLUCIÓN – Ejercicio 3 (RF.03): elimina un schedule y vuelve al detalle
  // FLUJO:
  //   1. removeSchedule(restaurantId, scheduleId) → DELETE al backend
  //   2. fetchSchedules() → refresca la lista (aunque luego navegamos)
  //   3. setScheduleToBeDeleted(null) → cierra el modal
  //   4. showMessage() → muestra feedback al usuario
  //   5. navigation.navigate('RestaurantDetailScreen', { id }) → vuelve al detalle
  const remove = async (schedule) => {
    try {
      await removeSchedule(schedule.restaurantId, schedule.id)
      await fetchSchedules()
      setScheduleToBeDeleted(null)
      showMessage({
        message: `Schedule ${schedule.startTime} - ${schedule.endTime} succesfully removed`,
        type: 'success',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
      // ⚠️ Tras borrar se navega al detalle del restaurante (así se refresca también)
      navigation.navigate('RestaurantDetailScreen', { id: schedule.restaurantId })
    } catch (error) {
      console.log(error)
      setScheduleToBeDeleted(null)
      showMessage({
        message: `Schedule ${schedule.startTime} - ${schedule.endTime} could not be removed.`,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }

  return (
    <>
      <FlatList
        style={styles.container}
        data={schedules}
        renderItem={renderSchedule}
        keyExtractor={item => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptySchedulesList}
      />

      {/* DeleteModal: se muestra cuando scheduleToBeDeleted !== null
          onCancel → cierra el modal (vuelve a null)
          onConfirm → llama a remove() con el schedule guardado
      */}
      <DeleteModal
        isVisible={scheduleToBeDeleted !== null}
        onCancel={() => setScheduleToBeDeleted(null)}
        onConfirm={() => remove(scheduleToBeDeleted)}>
          <TextRegular>The products of this scheduled will become unscheduled</TextRegular>
      </DeleteModal>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  button: {
    borderRadius: 8,
    height: 40,
    marginTop: 12,
    padding: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    width: '80%'
  },
  actionButton: {
    borderRadius: 8,
    height: 40,
    marginTop: 12,
    margin: '1%',
    padding: 10,
    alignSelf: 'center',
    flexDirection: 'column',
    width: '50%'
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    bottom: 5,
    position: 'absolute',
    width: '90%'
  },
  text: { fontSize: 16, color: 'white', alignSelf: 'center', marginLeft: 5 },
  emptyList: { textAlign: 'center', padding: 50 },
  productsAssociatedText: { textAlign: 'right', color: GlobalStyles.brandSecondary }
})
