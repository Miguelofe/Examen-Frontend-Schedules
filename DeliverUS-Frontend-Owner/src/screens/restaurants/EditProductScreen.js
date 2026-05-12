// =============================================================================
// ARCHIVO: EditProductScreen.js
// EJERCICIO: Ejercicio 5 – RF.06 (Asignar o desasignar horario a un producto)
// =============================================================================
//
// ¿QUÉ SE MODIFICA EN ESTE FICHERO?
// -----------------------------------
// Este archivo ya existía para editar productos. La SOLUCIÓN añade:
//
//   1. Un nuevo estado: isScheduleDropdownOpen, scheduleOptions
//   2. scheduleId en initialProductValues (para precargar el horario actual)
//   3. scheduleId en validationSchema (opcional, positivo, nullable)
//   4. Un useEffect adicional que carga los horarios del restaurante
//      UNA VEZ que el producto ya se ha cargado (depende de [product])
//   5. Un DropDownPicker con los horarios disponibles + opción "Not scheduled"
//      que escribe scheduleId en el formulario Formik
//
// FLUJO COMPLETO:
// ---------------
//   Al montar la pantalla:
//     a) fetchProductCategories()  → carga las categorías (ya existía)
//     b) fetchProductDetail()      → carga el producto, incluyendo scheduleId
//        → setProduct(preparedProduct)
//        → setInitialProductValues con scheduleId incluido
//     c) fetchRestaurantSchedules() → se dispara cuando product cambia (useEffect [product])
//        → carga los horarios del restaurante del producto
//        → los transforma a { label: "HH:mm - HH:mm", value: id } para el DropDownPicker
//
//   ⚠️ ORDEN IMPORTANTE: fetchRestaurantSchedules depende de product.restaurantId,
//      por eso está en un useEffect separado con [product] como dependencia.
//      Si se metiera todo en el mismo useEffect, product aún sería undefined.
//
// ESTRUCTURA DE DATOS:
//   product.restaurantId  → id del restaurante (para traer sus horarios)
//   product.scheduleId    → horario asignado actualmente (null si ninguno)
//   scheduleOptions       → array de { label, value } para el DropDownPicker
//
// DROPDOWN DE HORARIOS:
//   items={[
//     { label: 'Not scheduled', value: null },  ← opción para desasignar
//     ...scheduleOptions                         ← horarios del restaurante
//   ]}
//   value={values.scheduleId}                   ← valor actual en Formik
//   onSelectItem → setFieldValue('scheduleId', item.value)
//
// VALIDACIÓN YUP de scheduleId:
//   .number().nullable().optional().positive()
//   → nullable() permite que sea null (sin horario asignado)
//   → optional() no es obligatorio
//   → positive() si tiene valor, debe ser > 0
//
// TRAS GUARDAR:
//   update(product.id, values) → PUT /products/:id
//   → navigation.navigate('RestaurantDetailScreen', { id: product.restaurantId })
//
// =============================================================================

import React, { useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native'
import * as ExpoImagePicker from 'expo-image-picker'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import InputItem from '../../components/InputItem'
import TextRegular from '../../components/TextRegular'
import * as GlobalStyles from '../../styles/GlobalStyles'
import defaultProductImage from '../../../assets/product.jpeg'
import { showMessage } from 'react-native-flash-message'
import DropDownPicker from 'react-native-dropdown-picker'
import * as yup from 'yup'
import { ErrorMessage, Formik } from 'formik'
import TextError from '../../components/TextError'
import { getProductCategories, getDetail, update } from '../../api/ProductEndpoints'
import { prepareEntityImages } from '../../api/helpers/FileUploadHelper'
import { buildInitialValues } from '../Helper'
// SOLUCIÓN: importamos getRestaurantSchedules para cargar los horarios del restaurante
import { getRestaurantSchedules } from '../../api/RestaurantEndpoints'

export default function EditProductScreen ({ navigation, route }) {
  // Estado del dropdown de categorías (ya existía)
  const [open, setOpen] = useState(false)

  // SOLUCIÓN: estado del dropdown de horarios (separado del de categorías
  // para que no interfieran entre sí al abrir/cerrar)
  const [isScheduleDropdownOpen, setIsScheduleDropdownOpen] = useState(false)

  const [productCategories, setProductCategories] = useState([])
  const [backendErrors, setBackendErrors] = useState()
  const [product, setProduct] = useState()

  // SOLUCIÓN: opciones del dropdown de horarios
  // Formato: [{ label: "08:00:00 - 11:00:00", value: 1 }, ...]
  const [scheduleOptions, setScheduleOptions] = useState([])

  // SOLUCIÓN: se añade scheduleId: null a los initialValues
  // Así Formik puede precargar el horario actualmente asignado al producto
  const [initialProductValues, setInitialProductValues] = useState({
    name: null,
    description: null,
    price: null,
    order: null,
    productCategoryId: null,
    availability: null,
    image: null,
    scheduleId: null   // SOLUCIÓN: nuevo campo
  })

  const validationSchema = yup.object().shape({
    name: yup.string().max(255, 'Name too long').required('Name is required'),
    price: yup.number().positive('Please provide a positive price value').required('Price is required'),
    order: yup.number().nullable().positive('Please provide a positive order value').integer('Please provide an integer order value'),
    availability: yup.boolean(),
    productCategoryId: yup.number().positive().integer().required('Product category is required'),
    // SOLUCIÓN: scheduleId es opcional, puede ser null (sin horario) o un número positivo
    scheduleId: yup
      .number()
      .nullable()    // permite null (sin horario asignado)
      .optional()    // no es obligatorio
      .positive()    // si tiene valor, debe ser id > 0
  })

  // useEffect 1: carga categorías al montar (sin dependencia de product)
  useEffect(() => {
    async function fetchProductCategories () {
      try {
        const fetchedProductCategories = await getProductCategories()
        const fetchedProductCategoriesReshaped = fetchedProductCategories.map((e) => ({
          label: e.name,
          value: e.id
        }))
        setProductCategories(fetchedProductCategoriesReshaped)
      } catch (error) {
        showMessage({
          message: `There was an error while retrieving product categories. ${error} `,
          type: 'error',
          style: GlobalStyles.flashStyle,
          titleStyle: GlobalStyles.flashTextStyle
        })
      }
    }
    fetchProductCategories()
  }, [])

  // useEffect 2: carga el detalle del producto al montar / cambiar ruta
  useEffect(() => {
    async function fetchProductDetail () {
      try {
        const fetchedProduct = await getDetail(route.params.id)
        const preparedProduct = prepareEntityImages(fetchedProduct, ['image'])
        setProduct(preparedProduct)
        // buildInitialValues mapea los campos del producto a los initialValues del form
        // Incluye scheduleId si el producto tiene uno asignado
        const initialValues = buildInitialValues(preparedProduct, initialProductValues)
        setInitialProductValues(initialValues)
      } catch (error) {
        showMessage({
          message: `There was an error while retrieving product details (id ${route.params.id}). ${error}`,
          type: 'error',
          style: GlobalStyles.flashStyle,
          titleStyle: GlobalStyles.flashTextStyle
        })
      }
    }
    fetchProductDetail()
  }, [route])

  // SOLUCIÓN: useEffect 3 – carga los horarios del restaurante
  // Se ejecuta cuando product cambia (después de que fetchProductDetail termine)
  // Necesitamos product.restaurantId para saber de qué restaurante traer los horarios
  useEffect(() => {
    async function fetchRestaurantSchedules () {
      try {
        const fetchedRestaurantSchedules = await getRestaurantSchedules(product.restaurantId)
        // Transformamos los schedules al formato { label, value } del DropDownPicker
        const fetchedRestaurantSchedulesOptions = fetchedRestaurantSchedules.map((schedule) => ({
          label: `${schedule.startTime} - ${schedule.endTime}`,
          value: schedule.id
        }))
        setScheduleOptions(fetchedRestaurantSchedulesOptions)
      } catch (error) {
        showMessage({
          message: `There was an error while retrieving restaurant schedules. ${error} `,
          type: 'error',
          style: GlobalStyles.flashStyle,
          titleStyle: GlobalStyles.flashTextStyle
        })
      }
    }
    // Solo llamamos cuando product ya está cargado (guard: if product)
    if (product) { fetchRestaurantSchedules() }
  }, [product]) // depende de [product], no de [route]

  const pickImage = async (onSuccess) => {
    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1
    })
    if (!result.canceled) {
      if (onSuccess) { onSuccess(result) }
    }
  }

  const updateProduct = async (values) => {
    setBackendErrors([])
    try {
      const updatedProduct = await update(product.id, values)
      showMessage({
        message: `Product ${updatedProduct.name} succesfully updated`,
        type: 'success',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
      navigation.navigate('RestaurantDetailScreen', { id: product.restaurantId })
    } catch (error) {
      console.log(error)
      setBackendErrors(error.errors)
    }
  }

  return (
    <Formik
      enableReinitialize   // necesario: los initialValues se cargan de forma asíncrona
      validationSchema={validationSchema}
      initialValues={initialProductValues}
      onSubmit={updateProduct}>
      {({ handleSubmit, setFieldValue, values }) => (
        <ScrollView>
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: '60%' }}>
              {/* Campos del producto (sin cambios) */}
              <InputItem name='name' label='Name:' />
              <InputItem name='description' label='Description:' />
              <InputItem name='price' label='Price:' />
              <InputItem name='order' label='Order/position to be rendered:' />

              {/* Dropdown de categoría (sin cambios) */}
              <TextRegular textStyle={styles.textLabel}>Product category: </TextRegular>
              <DropDownPicker
                open={open}
                value={values.productCategoryId}
                items={productCategories}
                setOpen={setOpen}
                onSelectItem={item => { setFieldValue('productCategoryId', item.value) }}
                setItems={setProductCategories}
                placeholder="Select the product category"
                containerStyle={{ height: 40, marginBottom: 10 }}
                style={{ backgroundColor: GlobalStyles.brandBackground }}
                dropDownStyle={{ backgroundColor: '#fafafa' }}
              />
              <ErrorMessage name={'productCategoryId'} render={msg => <TextError>{msg}</TextError>} />

              {/* SOLUCIÓN – RF.06: Dropdown de horarios
                  -------------------------------------------------------
                  • items: siempre incluye { label: 'Not scheduled', value: null }
                    como primera opción para poder desasignar el horario.
                    Luego spread de scheduleOptions (los horarios del restaurante).
                  • value={values.scheduleId}: el valor actual en Formik
                    (precargado con el scheduleId del producto si tenía uno).
                  • onSelectItem: actualiza scheduleId en Formik con el id elegido
                    (o null si se elige "Not scheduled").
                  • isScheduleDropdownOpen: estado independiente para que abrir
                    este dropdown no interfiera con el de categorías.
              */}
              <TextRegular textStyle={styles.textLabel}>Schedule: </TextRegular>
              <DropDownPicker
                open={isScheduleDropdownOpen}
                value={values.scheduleId}
                items={[
                  { label: 'Not scheduled', value: null },  // opción para desasignar
                  ...scheduleOptions                         // horarios disponibles
                ]}
                setOpen={setIsScheduleDropdownOpen}
                onSelectItem={item => { setFieldValue('scheduleId', item.value) }}
                setItems={setScheduleOptions}
                placeholder="Not scheduled"
                containerStyle={{ height: 40, marginBottom: 10 }}
                style={{ backgroundColor: GlobalStyles.brandBackground }}
                dropDownStyle={{ backgroundColor: '#fafafa' }}
              />
              <ErrorMessage name={'scheduleId'} render={msg => <TextError>{msg}</TextError>} />

              {/* Switch de disponibilidad (sin cambios) */}
              <TextRegular textStyle={styles.textLabel}>Available:</TextRegular>
              <Switch
                trackColor={{ false: GlobalStyles.brandSecondary, true: GlobalStyles.brandPrimary }}
                thumbColor={values.availability ? GlobalStyles.brandSecondary : '#f4f3f4'}
                value={values.availability}
                style={styles.switch}
                onValueChange={value => setFieldValue('availability', value)}
              />
              <ErrorMessage name={'availability'} render={msg => <TextError>{msg}</TextError>} />

              {/* Selector de imagen (sin cambios) */}
              <Pressable onPress={() =>
                pickImage(async result => { await setFieldValue('image', result) })
              }
                style={styles.imagePicker}
              >
                <TextRegular textStyle={styles.label}>Product image: </TextRegular>
                <Image style={styles.image} source={values.image ? { uri: values.image.assets[0].uri } : defaultProductImage} />
              </Pressable>

              {backendErrors &&
                backendErrors.map((error, index) => <TextError key={index}>{error.param}-{error.msg}</TextError>)
              }

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
  button: { borderRadius: 8, height: 40, padding: 10, width: '100%', marginTop: 20, marginBottom: 20 },
  text: { fontSize: 16, color: 'white', textAlign: 'center', marginLeft: 5 },
  imagePicker: { height: 40, paddingLeft: 10, marginTop: 10, marginBottom: 80 },
  image: { width: 100, height: 100, borderWidth: 1, alignSelf: 'center', marginTop: 5 },
  switch: { marginTop: 0 },
  textLabel: { marginTop: 10, marginBottom: 5, marginLeft: 10, fontSize: 12 }
})
