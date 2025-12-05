import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, LogBox } from 'react-native';
import { GooglePlacesAutocomplete, GooglePlacesAutocompleteRef } from 'react-native-google-places-autocomplete';
import { useTranslation } from 'react-i18next';

// --- SILENCIADOR DE AVISOS (Configuração Robusta) ---
// Isso impede que o erro "VirtualizedLists should never be nested" polua seu terminal.
// Esse erro é esperado em Dropdowns e não afeta o funcionamento neste caso.
LogBox.ignoreLogs([
  'VirtualizedLists should never be nested',
  'Encountered two children with the same key',
]);

interface CityAutocompleteProps {
  placeholder?: string;
  value?: string;
  onSelect: (city: string) => void;
}

// Chave da API (Mantenha a sua chave correta aqui)
const GOOGLE_API_KEY = "AIzaSyAci2s5EVtp0CQ8jbBTQFvyDA6octWS4wQ"; 

export const CityAutocomplete = ({ placeholder, value, onSelect }: CityAutocompleteProps) => {
  const { t } = useTranslation();
  const ref = useRef<GooglePlacesAutocompleteRef>(null);
  const [forceHide, setForceHide] = useState(false);

  useEffect(() => { if (value) ref.current?.setAddressText(value); }, [value]);

  return (
    <View style={styles.container}>
      <GooglePlacesAutocomplete
        ref={ref}
        placeholder={placeholder || t('city_placeholder_default')}
        listViewDisplayed={forceHide ? false : undefined}
        onPress={(data, details = null) => {
          const selectedCity = data.description;
          onSelect(selectedCity);
          ref.current?.setAddressText(selectedCity);
          setForceHide(true);
          ref.current?.blur();
        }}
        query={{ key: GOOGLE_API_KEY, language: 'pt-BR', types: '(cities)' }}
        
        // Diagnóstico de erro no console (apenas se falhar a conexão)
        onFail={(error) => console.log("Google Places Error:", error)}
        onNotFound={() => console.log("Google Places: Nenhuma cidade encontrada")}
        
        keyboardShouldPersistTaps="always"
        listUnderlayColor="#374151"
        
        // --- CONFIGURAÇÃO DA LISTA ---
        flatListProps={{ 
            keyboardShouldPersistTaps: 'always', 
            nestedScrollEnabled: true, // Permite rolar a lista dentro do formulário
            showsVerticalScrollIndicator: true,
        }}
        
        styles={{
          container: { flex: 0 },
          textInputContainer: { 
              backgroundColor: '#1F2937', 
              borderTopWidth: 0, 
              borderBottomWidth: 0, 
              padding: 0, 
              borderRadius: 8 
          },
          textInput: { 
              backgroundColor: '#1F2937', 
              color: '#FFF', 
              fontSize: 16, 
              height: 50, 
              borderRadius: 8, 
              borderWidth: 1, 
              borderColor: '#374151', 
              paddingHorizontal: 12 
          },
          listView: { 
              backgroundColor: '#1F2937', 
              zIndex: 9999, 
              position: 'absolute', 
              top: 55, 
              width: '100%', 
              borderWidth: 1, 
              borderColor: '#374151', 
              borderRadius: 8, 
              elevation: 99, 
              maxHeight: 220, // Limita a altura para não cobrir a tela toda
          },
          row: { backgroundColor: '#1F2937', padding: 13, height: 44, flexDirection: 'row' },
          separator: { height: 0.5, backgroundColor: '#374151' },
          description: { color: '#D1D5DB' },
          loader: { flexDirection: 'row', justifyContent: 'flex-end', height: 20 },
        }}
        textInputProps={{ 
            placeholderTextColor: '#6B7280', 
            onChangeText: () => { setForceHide(false); } 
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
        zIndex: 20,
    } 
});