// =============================================================================
// ARCHIVO: RestaurantDetailScreen.js
// EJERCICIO: Ejercicio 1 – RF.01 (Listado de productos con horarios) +
//            Ejercicio 2 – RF.02 (botón para ir a gestión de horarios)
// =============================================================================
//
// ¿QUÉ SE MODIFICA EN ESTE FICHERO?
// -----------------------------------
// CAMBIO 1 (Ejercicio 1 – RF.01):
//   • En el renderProduct, para cada producto se añade una fila visual que
//     muestra el horario asignado (startTime - endTime) si existe, o el
//     texto "Not scheduled" si no hay horario.
//   • Se usa el icono 'timetable' de MaterialCommunityIcons.
//   • El color verde (brandGreen) indica que tiene horario asignado.
//   • El color primario (brandPrimary) indica que no tiene horario.
//   • La lógica es: item.schedule ? mostrar horario : mostrar "Not scheduled"
//
// CAMBIO 2 (Ejercicio 2 – RF.02):
//   • En el renderHeader, se añade un botón "Manage schedules" que navega
//     a RestaurantSchedulesScreen pasando el id del restaurante como param.
//   • navigation.navigate('RestaurantSchedulesScreen', { id: restaurant.id })
//
// ESTRUCTURA DE DATOS QUE LLEGA DEL BACKEND (GET /restaurants/:id):
//   restaurant.products[i].schedule → null (sin horario) o:
//     { id, startTime: "HH:mm:ss", endTime: "HH:mm:ss", restaurantId, ... }
//
// =============================================================================

/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react'
import { StyleSheet, View, FlatList, ImageBackground, Image, Pressable } from 'react-native'
import { showMessage } from 'react-native-flash-message'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { getDetail } from '../../api/RestaurantEndpoints'
import { remove } from '../../api/ProductEndpoints'
import ImageCard from '../../components/ImageCard'
import TextRegular from '../../components/TextRegular'
import TextSemiBold from '../../components/TextSemibold'
import * as GlobalStyles from '../../styles/GlobalStyles'
import DeleteModal from '../../components/DeleteModal'
import defaultProductImage from '../../../assets/product.jpeg'
import { API_BASE_URL } from '@env'

export default function RestaurantDetailScreen ({ navigation, route }) {
  const [restaurant, setRestaurant] = useState({})
  const [productToBeDeleted, setProductToBeDeleted] = useState(null)

  // Recarga el detalle del restaurante cada vez que cambia la ruta
  // (por ejemplo, al volver de editar un producto o de gestionar horarios)
  useEffect(() => {
    fetchRestaurantDetail()
  }, [route])

  const renderHeader = () => {
    return (
      <View>
        {/* Imagen de cabecera y datos del restaurante (sin cambios) */}
        <ImageBackground source={(restaurant?.heroImage) ? { uri: API_BASE_URL + '/' + restaurant.heroImage, cache: 'force-cache' } : undefined} style={styles.imageBackground}>
          <View style={styles.restaurantHeaderContainer}>
            <TextSemiBold textStyle={styles.textTitle}>{restaurant.name}</TextSemiBold>
            <Image style={styles.image} source={restaurant.logo ? { uri: API_BASE_URL + '/' + restaurant.logo, cache: 'force-cache' } : undefined} />
            <TextRegular textStyle={styles.description}>{restaurant.description}</TextRegular>
            <TextRegular textStyle={styles.description}>{restaurant.restaurantCategory ? restaurant.restaurantCategory.name : ''}</TextRegular>
          </View>
        </ImageBackground>

        {/* Botón ya existente: Crear producto */}
        <Pressable
          onPress={() => navigation.navigate('CreateProductScreen', { id: restaurant.id })}
          style={({ pressed }) => [
            { backgroundColor: pressed ? GlobalStyles.brandGreenTap : GlobalStyles.brandGreen },
            styles.button
          ]}>
          <View style={[{ flex: 1, flexDirection: 'row', justifyContent: 'center' }]}>
            <MaterialCommunityIcons name='plus-circle' color={'white'} size={20} />
            <TextRegular textStyle={styles.text}>Create product</TextRegular>
          </View>
        </Pressable>

        {/* SOLUCIÓN – Ejercicio 2 (RF.02): botón para gestionar horarios
            -------------------------------------------------------
            • Navega a RestaurantSchedulesScreen pasando el id del restaurante.
            • Se usa color brandBlue para diferenciarlo del botón verde de productos.
            • El icono 'timetable' es el indicado en el enunciado.
        */}
        <Pressable
          onPress={() => navigation.navigate('RestaurantSchedulesScreen', { id: restaurant.id })}
          style={({ pressed }) => [
            { backgroundColor: pressed ? GlobalStyles.brandBlueTap : GlobalStyles.brandBlue },
            styles.button
          ]}>
          <View style={[{ flex: 1, flexDirection: 'row', justifyContent: 'center' }]}>
            <MaterialCommunityIcons name='timetable' color={'white'} size={20} />
            <TextRegular textStyle={styles.text}>Manage schedules</TextRegular>
          </View>
        </Pressable>
      </View>
    )
  }

  const renderProduct = ({ item }) => {
    return (
      <ImageCard
        imageUri={item.image ? { uri: API_BASE_URL + '/' + item.image } : defaultProductImage}
        title={item.name}
      >
        <TextRegular numberOfLines={2}>{item.description}</TextRegular>
        <TextSemiBold textStyle={styles.price}>{item.price.toFixed(2)}€</TextSemiBold>

        {/* SOLUCIÓN – Ejercicio 1 (RF.01): mostrar horario de cada producto
            -------------------------------------------------------
            • Se comprueba si item.schedule existe (no es null/undefined).
            • Si existe → icono verde + "HH:mm:ss - HH:mm:ss"
            • Si no existe → icono primario + "Not scheduled"
            • Se usa flexDirection: 'row' para poner icono y texto en línea.
            • justifyContent: 'space-between' separa el horario de la disponibilidad.
        */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {item.schedule
              ? <>
                  <MaterialCommunityIcons name="timetable" size={18} color={GlobalStyles.brandGreen} />
                  <TextRegular textStyle={{ color: GlobalStyles.brandGreen }}>
                    {item.schedule.startTime} - {item.schedule.endTime}
                  </TextRegular>
                </>
              : <>
                  <MaterialCommunityIcons name="timetable" size={18} color={GlobalStyles.brandPrimary} />
                  <TextRegular textStyle={{ color: GlobalStyles.brandPrimary }}>Not scheduled</TextRegular>
                </>
            }
          </View>
          <View>
            {!item.availability &&
              <TextRegular textStyle={styles.availability}>Not available</TextRegular>
            }
          </View>
        </View>
        {/* FIN SOLUCIÓN */}

        <View style={styles.actionButtonsContainer}>
          <Pressable
            onPress={() => navigation.navigate('EditProductScreen', { id: item.id })}
            style={({ pressed }) => [
              { backgroundColor: pressed ? GlobalStyles.brandBlueTap : GlobalStyles.brandBlue },
              styles.actionButton
            ]}>
            <View style={[{ flex: 1, flexDirection: 'row', justifyContent: 'center' }]}>
              <MaterialCommunityIcons name='pencil' color={'white'} size={20}/>
              <TextRegular textStyle={styles.text}>Edit</TextRegular>
            </View>
          </Pressable>

          <Pressable
            onPress={() => { setProductToBeDeleted(item) }}
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

  const renderEmptyProductsList = () => {
    return (
      <TextRegular textStyle={styles.emptyList}>
        This restaurant has no products yet.
      </TextRegular>
    )
  }

  // Llama al endpoint GET /restaurants/:id y guarda el resultado en state
  const fetchRestaurantDetail = async () => {
    try {
      const fetchedRestaurant = await getDetail(route.params.id)
      setRestaurant(fetchedRestaurant)
    } catch (error) {
      showMessage({
        message: `There was an error while retrieving restaurant details (id ${route.params.id}). ${error}`,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }

  const removeProduct = async (product) => {
    try {
      await remove(product.id)
      await fetchRestaurantDetail()
      setProductToBeDeleted(null)
      showMessage({
        message: `Product ${product.name} succesfully removed`,
        type: 'success',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    } catch (error) {
      console.log(error)
      setProductToBeDeleted(null)
      showMessage({
        message: `Product ${product.name} could not be removed.`,
        type: 'error',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })
    }
  }

  return (
    <View style={styles.container}>
      <FlatList
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyProductsList}
        style={styles.container}
        data={restaurant.products}
        renderItem={renderProduct}
        keyExtractor={item => item.id.toString()}
      />
      <DeleteModal
        isVisible={productToBeDeleted !== null}
        onCancel={() => setProductToBeDeleted(null)}
        onConfirm={() => removeProduct(productToBeDeleted)}>
          <TextRegular>If the product belong to some order, it cannot be deleted.</TextRegular>
      </DeleteModal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  row: { padding: 15, marginBottom: 5, backgroundColor: GlobalStyles.brandSecondary },
  restaurantHeaderContainer: {
    height: 250,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'column',
    alignItems: 'center'
  },
  imageBackground: { flex: 1, resizeMode: 'cover', justifyContent: 'center' },
  image: { height: 100, width: 100, margin: 10 },
  description: { color: 'white' },
  textTitle: { fontSize: 20, color: 'white' },
  emptyList: { textAlign: 'center', padding: 50 },
  button: {
    borderRadius: 8,
    height: 40,
    marginTop: 12,
    padding: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    width: '80%'
  },
  text: { fontSize: 16, color: 'white', alignSelf: 'center', marginLeft: 5 },
  // SOLUCIÓN: color para el texto "Not available"
  availability: { color: GlobalStyles.brandSecondary },
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
  }
})
