import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Portal, Modal, List, Searchbar } from 'react-native-paper';
import { countryCodes, defaultCountryCode } from '../data/countryCodes';

const PhoneInput = ({ 
  value = '', 
  onChangeText = () => {}, 
  error = false, 
  label = "Phone Number", 
  placeholder = "Enter phone number",
  style,
  ...props 
}) => {
  const [selectedCountry, setSelectedCountry] = useState(defaultCountryCode);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [localValue, setLocalValue] = useState('');

  // Initialize local value from prop
  useEffect(() => {
    if (value) {
      // Remove country code from the value if it exists
      const cleanValue = value.replace(/^\+\d+/, '');
      setLocalValue(cleanValue);
    } else {
      setLocalValue('');
    }
  }, [value]);

  // Filter countries based on search query
  const filteredCountries = countryCodes.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.code.includes(searchQuery) ||
    country.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCountrySelect = (country) => {
    try {
      setSelectedCountry(country);
      setShowCountryPicker(false);
      setSearchQuery('');
      // Update the full phone number when country changes
      const fullNumber = country.code + localValue;
      onChangeText(fullNumber);
    } catch (error) {
      console.error('Error selecting country:', error);
    }
  };

  const handlePhoneChange = (text) => {
    try {
      // Remove any non-digit characters from the input
      const cleanNumber = text.replace(/\D/g, '');
      setLocalValue(cleanNumber);
      // Combine country code with the clean number
      const fullNumber = selectedCountry.code + cleanNumber;
      onChangeText(fullNumber);
    } catch (error) {
      console.error('Error changing phone number:', error);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.phoneInputContainer}>
        <Button
          mode="outlined"
          onPress={() => setShowCountryPicker(true)}
          style={styles.countryButton}
          contentStyle={styles.countryButtonContent}
        >
          {selectedCountry?.flag || '🇺🇸'} {selectedCountry?.code || '+1'}
        </Button>
        
        <TextInput
          label={label}
          value={localValue}
          onChangeText={handlePhoneChange}
          mode="outlined"
          style={styles.phoneInput}
          error={error}
          keyboardType="phone-pad"
          placeholder={placeholder}
          {...props}
        />
      </View>

      <Portal>
        <Modal
          visible={showCountryPicker}
          onDismiss={() => setShowCountryPicker(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Searchbar
            placeholder="Search countries..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />
          
          <ScrollView style={styles.countryList}>
            {filteredCountries.map((country, index) => (
              <List.Item
                key={`${country.country}-${index}`}
                title={`${country.flag} ${country.name}`}
                description={`${country.code}`}
                onPress={() => handleCountrySelect(country)}
                style={[
                  styles.countryItem,
                  selectedCountry?.country === country.country && styles.selectedCountry
                ]}
                titleStyle={styles.countryItemTitle}
                descriptionStyle={styles.countryItemDescription}
              />
            ))}
          </ScrollView>
          
          <Button
            mode="contained"
            onPress={() => setShowCountryPicker(false)}
            style={styles.closeButton}
          >
            Close
          </Button>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countryButton: {
    minWidth: 80,
    height: 56,
  },
  countryButtonContent: {
    height: 56,
  },
  phoneInput: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  searchbar: {
    margin: 16,
  },
  countryList: {
    maxHeight: 400,
  },
  countryItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedCountry: {
    backgroundColor: '#e3f2fd',
  },
  countryItemTitle: {
    fontSize: 16,
  },
  countryItemDescription: {
    fontSize: 14,
    color: '#666',
  },
  closeButton: {
    margin: 16,
  },
});

export default PhoneInput; 