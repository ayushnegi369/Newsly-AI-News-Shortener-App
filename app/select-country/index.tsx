import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COUNTRIES } from '../../constants/countries';
import CountryFlag from 'react-native-country-flag';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SelectCountry() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const router = useRouter();

  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.includes(search)
  );

  const handleNext = async () => {
    if (!selected) return;
    try {
      const userStr = await AsyncStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (user && user.email) {
        await fetch('http://localhost:8080/update-user-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, country: selected }),
        });
      }
    } catch (err) {
      // Optionally handle error
    }
    router.push('/choose-topic');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity style={styles.backArrow} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.header}>Select your Country</Text>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor="#888"
          value={search}
          onChangeText={setSearch}
        />
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
      </View>

      {/* Country List */}
      <FlatList
        data={filteredCountries}
        keyExtractor={item => item.name}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.countryRow}
            onPress={() => setSelected(item.name)}
            activeOpacity={0.7}
          >
            <CountryFlag isoCode={item.isoCode} size={32} style={styles.flag} />
            <View style={{ flexDirection: 'column', flex: 1 }}>
              <Text style={styles.countryName}>{item.name}</Text>
              <Text style={styles.countryCode}>{item.code}</Text>
            </View>
            {selected === item.name && (
              <Ionicons name="checkmark-circle" size={22} color="#2563eb" style={{ marginLeft: 'auto' }} />
            )}
          </TouchableOpacity>
        )}
        style={{ flex: 1, marginTop: 8 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />

      {/* Next Button */}
      <TouchableOpacity
        style={[styles.nextButton, { opacity: selected ? 1 : 0.5 }]}
        disabled={!selected}
        onPress={handleNext}
      >
        <Text style={styles.nextButtonText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181A20',
    paddingHorizontal: 16,
    paddingTop: 48,
  },
  backArrow: {
    position: 'absolute',
    top: 48,
    left: 16,
    zIndex: 2,
    padding: 4,
  },
  header: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#23252B',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  searchIcon: {
    marginLeft: 8,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 2,
    backgroundColor: 'transparent',
  },
  flag: {
    width: 32,
    height: 22,
    borderRadius: 4,
    marginRight: 16,
    backgroundColor: '#222',
    overflow: 'hidden',
  },
  countryName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  countryCode: {
    color: '#aaa',
    fontSize: 13,
    marginTop: 2,
  },
  nextButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
