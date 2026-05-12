// =============================================================================
// ARCHIVO: EditScheduleScreen.js
// EJERCICIO: Ejercicio 4 – RF.05 (Edición de un horario existente)
// =============================================================================
//
// ¿QUÉ HACE ESTA PANTALLA?
// -------------------------
// Formulario para editar los campos startTime y endTime de un schedule ya
// existente. Los valores se precargan con los del schedule actual (enableReinitialize).
//
// PARÁMETROS DE NAVEGACIÓN QUE RECIBE:
//   route.params.scheduleId   → id del schedule a editar
//   route.params.restaurantId → id del restaurante al que pertenece
//
// PATRÓN FORMIK USADO (igual que CreateScheduleScreen):
//   1. Estado: schedule (objeto), initialScheduleValues, backendErrors
//   2. useEffect → fetchScheduleDetail() carga el schedule y rellena initialValues
//   3. Formik con enableReinitialize=true (necesario para cargar valores async)
//   4. validationSchema con yup (mismas reglas que en Create)
//   5. onSubmit → update() que llama a updateSchedule() y navega al detalle
//
// TRUCO IMPORTANTE – getRestaurantSchedule:
//   Como no hay GET /restaurants/:id/schedules/:scheduleId, se usa:
//     getRestaurantSchedule(restaurantId, scheduleId)
//   que internamente hace GET /restaurants/:id/schedules (todos) y filtra por id.
//
// VALIDACIÓN con YUP:
//   • startTime y endTime: obligatorio + regex HH:mm:ss
//   • Regex: /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/
//     → [01]\d = 00-19, 2[0-3] = 20-23 → horas válidas 00-23
//     → [0-5]\d = 00-59 → minutos y segundos válidos
//
// buildInitialValues (Helper.js):
//   Toma el objeto schedule del backend y el objeto de initialValues por defecto,
//   y devuelve un nuevo objeto con los campos que coincidan en nombre.
//   Así se evita pasar propiedades extra del backend al formulario.
//
// FLUJO TRAS GUARDAR:
//   updateSchedule → success → navigation.navigate('RestaurantDetailScreen', { id })
//
// =============================================================================

import React, { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import InputItem from '../../components/InputItem'
import TextRegular from '../../components/TextRegular'
import * as GlobalStyles from '../../styles/GlobalStyles'
import { showMessage } from 'react-native-flash-message'
import * as yup from 'yup'
import { Formik } from 'formik'
import TextError from '../../components/TextError'
import { buildInitialValues } from '../Helper'
// SOLUCIÓN: importamos getRestaurantSchedule y updateSchedule
import { getRestaurantSchedule, updateSchedule } from '../../api/RestaurantEndpoints'

export default function EditScheduleScreen ({ navigation, route }) {
  // SOLUCIÓN: estados de la pantalla
  const [backendErrors, setBackendErrors] = useState()    // errores del servidor
  const [schedule, setSchedule] = useState()              // schedule cargado del backend

  // initialScheduleValues: valores iniciales del formulario Formik
  // Se inicializan a null y se rellenan en el useEffect
  const [initialScheduleValues, setInitialScheduleValues] = useState({ startTime: null, endTime: null })

  // VALIDACIÓN YUP: mismas reglas que en CreateScheduleScreen
  const validationSchema = yup.object().shape({
    startTime: yup
      .string()
      .required('Start time is required')
      .matches(
        /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/,
        'The time must be in the HH:mm (e.g. 14:30:00) format'
      ),
    endTime: yup
      .string()
      .required('End time is required')
      .matches(
        /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/,
        'The time must be in the HH:mm (e.g. 14:30:00) format'
      )
  })

  // SOLUCIÓN: carga del schedule al montar la pantalla
  useEffect(() => {
    async function fetchScheduleDetail () {
      try {
        // getRestaurantSchedule = trae todos y filtra por scheduleId
        const fetchedSchedule = await getRestaurantSchedule(route.params.restaurantId, route.params.scheduleId)
        setSchedule(fetchedSchedule)
        // buildInitialValues: mapea los campos del schedule a los initialValues del form
        setInitialScheduleValues(buildInitialValues(fetchedSchedule, initialScheduleValues))
      } catch (error) {
        showMessage({
          message: `There was an error while retrieving schedule details (id ${route.params.id}). ${error}`,
          type: 'error',
          style: GlobalStyles.flashStyle,
          titleStyle: GlobalStyles.flashTextStyle
        })
      }
    }
    fetchScheduleDetail()
  }, [route])

  // SOLUCIÓN: función de actualización del schedule
  const update = async (values) => {
    setBackendErrors([])
    try {
      const updatedSchedule = await updateSchedule(schedule.restaurantId, schedule.id, values)
      showMessage({
        message: `Schedule id ${updatedSchedule.id} succesfully updated`,
        type: 'success',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
      // Tras editar → volver al detalle del restaurante
      navigation.navigate('RestaurantDetailScreen', { id: schedule.restaurantId })
    } catch (error) {
      console.log(error)
      setBackendErrors(error.errors)
    }
  }

  return (
    // enableReinitialize=true: permite que Formik reinicialice los valores
    // cuando initialScheduleValues cambia (por la carga async del useEffect)
    <Formik
      enableReinitialize
      validationSchema={validationSchema}
      initialValues={initialScheduleValues}
      onSubmit={update}>
      {({ handleSubmit, setFieldValue, values }) => (
        <ScrollView>
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: '60%' }}>
              {/* InputItem: componente reutilizable que conecta con Formik
                  mediante el campo name (usa useField internamente) */}
              <InputItem
                name='startTime'
                label='Start Time (HH:mm:ss):'
              />
              <InputItem
                name='endTime'
                label='End Time (HH:mm:ss):'
              />

              {/* Errores del backend (validación del servidor) */}
              {backendErrors &&
                backendErrors.map((error, index) => <TextError key={index}>{error.param}-{error.msg}</TextError>)
              }

              {/* Botón guardar */}
              <Pressable
                onPress={ handleSubmit }
                style={({ pressed }) => [
                  { backgroundColor: pressed ? GlobalStyles.brandSuccessTap : GlobalStyles.brandSuccess },
                  styles.button
                ]}>
                <View style={[{ flex: 1, flexDirection: 'row', justifyContent: 'center' }]}>
                  <MaterialCommunityIcons name='content-save' color={'white'} size={20}/>
                  <TextRegular textStyle={styles.text}>Save</TextRegular>
                </View>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      )}
    </Formik>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    height: 40,
    padding: 10,
    width: '100%',
    marginTop: 20,
    marginBottom: 20
  },
  text: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginLeft: 5
  }
})
