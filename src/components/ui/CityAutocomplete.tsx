// src/components/ui/CityAutocomplete.tsx

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, LogBox } from 'react-native';
import { GooglePlacesAutocomplete, GooglePlacesAutocompleteRef } from 'react-native-google-places-autocomplete';

// Silencia o aviso de listas aninhadas
LogBox.ignoreLogs(['VirtualizedLists should never be nested']);

interface CityAutocompleteProps {
  placeholder: string;
  value?: string;
  onSelect: (city: string) => void;
}

// ✅ SUA CHAVE
const GOOGLE_API_KEY = "AIzaSyAci2s5EVtp0CQ8jbBTQFvyDA6octWS4wQ"; 

export const CityAutocomplete = ({ placeholder, value, onSelect }: CityAutocompleteProps) => {
  const ref = useRef<GooglePlacesAutocompleteRef>(null);
  
  // Estado para FORÇAR o fechamento da lista após seleção
  const [forceHide, setForceHide] = useState(false);

  useEffect(() => {
    // Sincroniza valor inicial ou alterações externas
    if (value) {
      ref.current?.setAddressText(value);
    }
  }, [value]);

  return (
    <View style={styles.container}>
      <GooglePlacesAutocomplete
        ref={ref}
        placeholder={placeholder || "Digite a cidade..."}
        
        // --- LÓGICA INTELIGENTE DE VISIBILIDADE ---
        // Se forceHide for true, esconde (false). 
        // Se for false, passa undefined (deixa a lib controlar automático)
        listViewDisplayed={forceHide ? false : undefined}
        
        onPress={(data, details = null) => {
          const selectedCity = data.description;
          
          // 1. Atualiza pai e campo
          onSelect(selectedCity);
          ref.current?.setAddressText(selectedCity);
          
          // 2. TRUQUE: Força a lista a sumir imediatamente
          setForceHide(true);
          
          // 3. Tira o foco
          ref.current?.blur();
        }}
        
        query={{
          key: GOOGLE_API_KEY,
          language: 'pt-BR',
          types: '(cities)', 
        }}
        
        keyboardShouldPersistTaps="always"
        listUnderlayColor="#374151"
        
        flatListProps={{
          keyboardShouldPersistTaps: 'always',
          scrollEnabled: false, 
          nestedScrollEnabled: true,
          style: { flexGrow: 0 }
        }}

        styles={{
          container: { flex: 0 },
          textInputContainer: {
            backgroundColor: '#1F2937', 
            borderTopWidth: 0, 
            borderBottomWidth: 0,
            padding: 0,
            borderRadius: 8,
          },
          textInput: {
            backgroundColor: '#1F2937', 
            color: '#FFF',
            fontSize: 16,
            height: 50,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#374151', 
            paddingHorizontal: 12,
          },
          listView: {
            backgroundColor: '#1F2937', 
            zIndex: 10000,
            position: 'absolute', 
            top: 55, 
            width: '100%',
            borderWidth: 1,
            borderColor: '#374151',
            borderRadius: 8,
            elevation: 10, 
          },
          row: {
            backgroundColor: '#1F2937',
            padding: 13,
            height: 44,
            flexDirection: 'row',
          },
          separator: {
            height: 0.5,
            backgroundColor: '#374151',
          },
          description: { color: '#D1D5DB' },
          loader: { flexDirection: 'row', justifyContent: 'flex-end', height: 20 },
        }}
        
        textInputProps={{
          placeholderTextColor: '#6B7280',
          // Se o usuário voltar a digitar, liberamos a lista para aparecer de novo
          onChangeText: () => {
             setForceHide(false);
          }
        }}
        
        enablePoweredByContainer={false}
        minLength={2} 
        fetchDetails={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    zIndex: 10,
  }
});