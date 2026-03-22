'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/app/lib/api';

type Hotspot = {
  name: string;
  lat: number;
  lng: number;
  type: string;
  severity: string;
  value: number;
  region?: string;
};

type ClimateRegion = {
  region: string;
  temp: string;
  drought: string;
  flood: string;
  cropRisk: number;
};

type Incident = {
  name: string;
  lat: number;
  lng: number;
  type: string;
  date: string;
};

type Industry = {
  name: string;
  percentage: number;
  value_usd_billion: number;
};

type AgriculturalZone = {
  zone: string;
  countries: string[];
  crops: string[];
  production_million_tons: number;
  employment_percent: number;
};

type EconomicRegion = {
  name: string;
  gdp_usd_trillion: number;
  gdp_growth_percent: number;
  population_billion: number;
  employment_rate: number;
  unemployment_rate: number;
  major_industries: Industry[];
  agriculture_zones: AgriculturalZone[];
};

type GeospatialMetrics = {
  hotspots: Hotspot[];
  climateRegions: ClimateRegion[];
  incidents: Incident[];
  economicRegions?: EconomicRegion[];
};

// Fallback sample data - 100+ Hotspots (Critical & High-Risk Zones)
const SAMPLE_HOTSPOTS: Hotspot[] = [
  // Europe (15)
  { name: 'Eastern Ukraine', lat: 48.5, lng: 37.8, type: 'conflict', severity: 'critical', value: 92, region: 'Europe' },
  { name: 'Donbas Region', lat: 48.0, lng: 39.0, type: 'conflict', severity: 'critical', value: 91, region: 'Europe' },
  { name: 'Crimea Peninsula', lat: 44.5, lng: 34.2, type: 'territorial', severity: 'critical', value: 89, region: 'Europe' },
  { name: 'Belarus-EU Border', lat: 54.0, lng: 25.0, type: 'humanitarian', severity: 'high', value: 68, region: 'Europe' },
  { name: 'Moldova Transnistria', lat: 47.4, lng: 29.5, type: 'territorial', severity: 'high', value: 71, region: 'Europe' },
  { name: 'Kosovo-Serbia Border', lat: 42.6, lng: 21.2, type: 'political', severity: 'high', value: 62, region: 'Europe' },
  { name: 'North Macedonia dispute', lat: 41.6, lng: 21.7, type: 'political', severity: 'medium', value: 58, region: 'Europe' },
  { name: 'Cyprus Division', lat: 35.1, lng: 33.4, type: 'territorial', severity: 'medium', value: 55, region: 'Europe' },
  { name: 'Nagorno-Karabakh', lat: 40.2, lng: 46.8, type: 'conflict', severity: 'high', value: 75, region: 'Caucasus' },
  { name: 'Georgia South Ossetia', lat: 42.3, lng: 43.9, type: 'territorial', severity: 'high', value: 70, region: 'Caucasus' },
  { name: 'Georgia Abkhazia', lat: 43.0, lng: 41.0, type: 'territorial', severity: 'high', value: 69, region: 'Caucasus' },
  { name: 'Polisarua Sahara', lat: 27.0, lng: -11.0, type: 'territorial', severity: 'medium', value: 52, region: 'Africa' },
  { name: 'Northern Ireland', lat: 54.4, lng: -6.0, type: 'political', severity: 'low', value: 35, region: 'Europe' },
  { name: 'Catalonia Region', lat: 42.0, lng: 1.5, type: 'political', severity: 'low', value: 38, region: 'Europe' },
  { name: 'Basque Country', lat: 43.2, lng: -2.5, type: 'political', severity: 'low', value: 32, region: 'Europe' },

  // Middle East & Central Asia (25)
  { name: 'Syria', lat: 34.8, lng: 38.9, type: 'conflict', severity: 'critical', value: 89, region: 'Middle East' },
  { name: 'Yemen', lat: 15.5, lng: 48.5, type: 'humanitarian', severity: 'critical', value: 85, region: 'Middle East' },
  { name: 'Iraq', lat: 33.3, lng: 44.4, type: 'conflict', severity: 'high', value: 79, region: 'Middle East' },
  { name: 'Iran-Saudi Border', lat: 28.0, lng: 50.5, type: 'territorial', severity: 'high', value: 72, region: 'Middle East' },
  { name: 'Gaza Strip', lat: 31.9, lng: 35.2, type: 'humanitarian', severity: 'critical', value: 88, region: 'Middle East' },
  { name: 'West Bank', lat: 32.0, lng: 35.2, type: 'political', severity: 'high', value: 74, region: 'Middle East' },
  { name: 'Golan Heights', lat: 33.2, lng: 35.8, type: 'territorial', severity: 'high', value: 68, region: 'Middle East' },
  { name: 'Hormuz Strait', lat: 26.5, lng: 56.3, type: 'geopolitical', severity: 'high', value: 76, region: 'Middle East' },
  { name: 'Lebanon', lat: 33.8, lng: 35.9, type: 'political', severity: 'high', value: 71, region: 'Middle East' },
  { name: 'Iraq-Turkey Border', lat: 37.0, lng: 43.5, type: 'territorial', severity: 'medium', value: 59, region: 'Middle East' },
  { name: 'Afghanistan', lat: 33.9, lng: 67.2, type: 'conflict', severity: 'critical', value: 88, region: 'Central Asia' },
  { name: 'Tajikistan Civil Unrest', lat: 38.9, lng: 71.3, type: 'conflict', severity: 'high', value: 68, region: 'Central Asia' },
  { name: 'Kyrgyzstan-Tajikistan Border', lat: 37.5, lng: 72.0, type: 'territorial', severity: 'high', value: 73, region: 'Central Asia' },
  { name: 'Uzbekistan Border Tensions', lat: 41.0, lng: 64.0, type: 'territorial', severity: 'medium', value: 54, region: 'Central Asia' },
  { name: 'Kazakhstan Instability', lat: 48.0, lng: 68.0, type: 'political', severity: 'medium', value: 51, region: 'Central Asia' },
  { name: 'Turkmenistan Isolation', lat: 38.9, lng: 59.5, type: 'political', severity: 'low', value: 42, region: 'Central Asia' },
  { name: 'Pakistan-Afghanistan Border', lat: 34.5, lng: 70.0, type: 'conflict', severity: 'high', value: 75, region: 'South Asia' },
  { name: 'Pakistan-India Kashmir', lat: 34.3, lng: 77.0, type: 'conflict', severity: 'high', value: 74, region: 'South Asia' },
  { name: 'Iran-Iraq Border', lat: 31.5, lng: 48.0, type: 'territorial', severity: 'medium', value: 57, region: 'Middle East' },
  { name: 'Turkey-Syria Border', lat: 36.5, lng: 36.0, type: 'territorial', severity: 'high', value: 70, region: 'Middle East' },
  { name: 'Iran Sanctions Tension', lat: 32.0, lng: 53.0, type: 'geopolitical', severity: 'high', value: 71, region: 'Middle East' },
  { name: 'Qatar Blockade Effects', lat: 25.3, lng: 51.1, type: 'diplomatic', severity: 'medium', value: 48, region: 'Middle East' },
  { name: 'Jordan-Israel Border', lat: 31.5, lng: 35.5, type: 'territorial', severity: 'medium', value: 56, region: 'Middle East' },
  { name: 'Turkey-Iraq PKK Activity', lat: 37.5, lng: 44.0, type: 'conflict', severity: 'high', value: 69, region: 'Middle East' },
  { name: 'Turkey-Greece Aegean', lat: 39.0, lng: 26.0, type: 'territorial', severity: 'medium', value: 60, region: 'Europe/Middle East' },

  // Asia-Pacific (25)
  { name: 'Taiwan Strait', lat: 24.0, lng: 119.5, type: 'geopolitical', severity: 'critical', value: 87, region: 'Asia-Pacific' },
  { name: 'South China Sea', lat: 12.0, lng: 114.0, type: 'territorial', severity: 'high', value: 78, region: 'Asia-Pacific' },
  { name: 'Myanmar', lat: 21.9, lng: 95.9, type: 'conflict', severity: 'critical', value: 86, region: 'Asia' },
  { name: 'Kashmir Border (China-India)', lat: 35.0, lng: 77.5, type: 'territorial', severity: 'high', value: 72, region: 'Asia' },
  { name: 'AUKUS Tensions', lat: -25.3, lng: 133.8, type: 'geopolitical', severity: 'medium', value: 61, region: 'Asia-Pacific' },
  { name: 'Philippines-China Senkaku', lat: 15.0, lng: 120.0, type: 'territorial', severity: 'medium', value: 63, region: 'Asia-Pacific' },
  { name: 'Vietnam-China Border', lat: 21.5, lng: 106.0, type: 'territorial', severity: 'medium', value: 58, region: 'Asia' },
  { name: 'Ladakh Border (India-China)', lat: 33.5, lng: 78.5, type: 'territorial', severity: 'high', value: 76, region: 'Asia' },
  { name: 'North Korea Missile Tests', lat: 40.3, lng: 127.5, type: 'geopolitical', severity: 'high', value: 79, region: 'Asia' },
  { name: 'US-China Tech War', lat: 37.9, lng: -95.7, type: 'economic', severity: 'high', value: 73, region: 'Global' },
  { name: 'Hong Kong', lat: 22.3, lng: 114.2, type: 'political', severity: 'high', value: 71, region: 'Asia' },
  { name: 'Xinjiang Tensions', lat: 41.2, lng: 82.8, type: 'humanitarian', severity: 'high', value: 68, region: 'Asia' },
  { name: 'Tibet Autonomy', lat: 28.3, lng: 84.1, type: 'political', severity: 'medium', value: 55, region: 'Asia' },
  { name: 'Maldives Political Crisis', lat: 4.1, lng: 73.5, type: 'political', severity: 'medium', value: 52, region: 'Asia' },
  { name: 'Thailand Import Tensions', lat: 15.9, lng: 100.9, type: 'political', severity: 'low', value: 41, region: 'Asia' },
  { name: 'Malaysia Religious Tensions', lat: 4.2, lng: 101.7, type: 'political', severity: 'medium', value: 54, region: 'Asia' },
  { name: 'Indonesia Extremist Activity', lat: -0.8, lng: 113.9, type: 'conflict', severity: 'medium', value: 59, region: 'Asia' },
  { name: 'Papua New Guinea Violence', lat: -6.3, lng: 143.9, type: 'humanitarian', severity: 'medium', value: 61, region: 'Oceania' },
  { name: 'Solomon Islands Tensions', lat: -9.6, lng: 160.1, type: 'political', severity: 'low', value: 44, region: 'Oceania' },
  { name: 'Fiji Political Instability', lat: -17.7, lng: 178.0, type: 'political', severity: 'low', value: 39, region: 'Oceania' },
  { name: 'Sri Lanka Political Crisis', lat: 7.8, lng: 80.7, type: 'political', severity: 'high', value: 67, region: 'South Asia' },
  { name: 'Bangladesh Extremism', lat: 23.7, lng: 90.4, type: 'conflict', severity: 'medium', value: 57, region: 'South Asia' },
  { name: 'Nepal Political Tensions', lat: 28.4, lng: 84.1, type: 'political', severity: 'low', value: 43, region: 'South Asia' },
  { name: 'Bhutan-China Border', lat: 27.5, lng: 90.5, type: 'territorial', severity: 'medium', value: 62, region: 'Asia' },
  { name: 'Japan-Korea Dispute', lat: 37.3, lng: 130.0, type: 'territorial', severity: 'low', value: 45, region: 'Asia' },

  // Africa (30)
  { name: 'Horn of Africa', lat: 8.0, lng: 46.0, type: 'humanitarian', severity: 'critical', value: 84, region: 'Africa' },
  { name: 'Sahel Region', lat: 14.5, lng: 1.0, type: 'conflict', severity: 'critical', value: 86, region: 'Africa' },
  { name: 'DRC Congo', lat: -4.0, lng: 21.7, type: 'conflict', severity: 'critical', value: 85, region: 'Africa' },
  { name: 'Sudan', lat: 12.8, lng: 30.8, type: 'conflict', severity: 'critical', value: 83, region: 'Africa' },
  { name: 'Somalia Piracy', lat: 5.1, lng: 46.2, type: 'humanitarian', severity: 'high', value: 76, region: 'Africa' },
  { name: 'South Sudan', lat: 6.9, lng: 31.3, type: 'humanitarian', severity: 'high', value: 78, region: 'Africa' },
  { name: 'Tigray Conflict', lat: 14.2, lng: 39.4, type: 'conflict', severity: 'high', value: 77, region: 'Africa' },
  { name: 'Mali Jihadist Activity', lat: 17.6, lng: -4.0, type: 'conflict', severity: 'high', value: 75, region: 'Africa' },
  { name: 'Burkina Faso Unrest', lat: 12.2, lng: -1.5, type: 'conflict', severity: 'high', value: 73, region: 'Africa' },
  { name: 'Cameroon Boko Haram', lat: 3.8, lng: 11.5, type: 'conflict', severity: 'high', value: 72, region: 'Africa' },
  { name: 'Nigeria Oil Delta', lat: 4.5, lng: 5.5, type: 'conflict', severity: 'high', value: 70, region: 'Africa' },
  { name: 'Benin Piracy Corridor', lat: 9.3, lng: 2.3, type: 'humanitarian', severity: 'medium', value: 63, region: 'Africa' },
  { name: 'Guinea-Conakry Mining Conflict', lat: 9.9, lng: -9.6, type: 'conflict', severity: 'medium', value: 59, region: 'Africa' },
  { name: 'Côte d\'Ivoire Political Divide', lat: 7.5, lng: -5.5, type: 'political', severity: 'medium', value: 57, region: 'Africa' },
  { name: 'Zimbabwe Economic Crisis', lat: -19.0, lng: 29.1, type: 'humanitarian', severity: 'high', value: 71, region: 'Africa' },
  { name: 'Mozambique Insurgency', lat: -18.7, lng: 35.3, type: 'conflict', severity: 'medium', value: 65, region: 'Africa' },
  { name: 'Malawi Political Strife', lat: -13.3, lng: 34.3, type: 'political', severity: 'medium', value: 56, region: 'Africa' },
  { name: 'South Africa Gang Violence', lat: -30.6, lng: 22.9, type: 'humanitarian', severity: 'high', value: 69, region: 'Africa' },
  { name: 'Lesotho Lawlessness', lat: -29.6, lng: 28.2, type: 'humanitarian', severity: 'medium', value: 61, region: 'Africa' },
  { name: 'Uganda Warlord Activity', lat: 1.4, lng: 32.3, type: 'conflict', severity: 'high', value: 68, region: 'Africa' },
  { name: 'Kenya Al-Shabaab', lat: -0.0, lng: 37.9, type: 'conflict', severity: 'high', value: 74, region: 'Africa' },
  { name: 'Tanzania Border Tensions', lat: -6.4, lng: 34.9, type: 'territorial', severity: 'medium', value: 53, region: 'Africa' },
  { name: 'Rwanda Stability Concerns', lat: -1.9, lng: 29.9, type: 'political', severity: 'low', value: 47, region: 'Africa' },
  { name: 'Burundi Political Crisis', lat: -3.4, lng: 29.9, type: 'political', severity: 'medium', value: 58, region: 'Africa' },
  { name: 'Libya State Fragmentation', lat: 26.3, lng: 17.2, type: 'conflict', severity: 'high', value: 77, region: 'Africa' },
  { name: 'Chad Regional Instability', lat: 15.5, lng: 18.7, type: 'conflict', severity: 'high', value: 72, region: 'Africa' },
  { name: 'Niger Extremist Presence', lat: 17.6, lng: 8.7, type: 'conflict', severity: 'high', value: 71, region: 'Africa' },
  { name: 'Mauritania Slavery Links', lat: 20.9, lng: -10.9, type: 'humanitarian', severity: 'medium', value: 62, region: 'Africa' },
  { name: 'Egypt Sinai Violence', lat: 30.8, lng: 34.0, type: 'conflict', severity: 'high', value: 76, region: 'Africa' },
  { name: 'Algeria Security Threats', lat: 28.0, lng: 1.6, type: 'conflict', severity: 'medium', value: 64, region: 'Africa' },

  // Americas (15)
  { name: 'Venezuela', lat: 6.4, lng: -66.6, type: 'humanitarian', severity: 'critical', value: 82, region: 'Americas' },
  { name: 'Colombia Drug Cartels', lat: 4.6, lng: -74.3, type: 'conflict', severity: 'high', value: 75, region: 'Americas' },
  { name: 'Mexico Drug War', lat: 23.6, lng: -102.5, type: 'conflict', severity: 'high', value: 77, region: 'Americas' },
  { name: 'Guatemala Gang Violence', lat: 15.8, lng: -90.2, type: 'humanitarian', severity: 'high', value: 72, region: 'Americas' },
  { name: 'Honduras Criminal Networks', lat: 15.2, lng: -86.2, type: 'conflict', severity: 'high', value: 71, region: 'Americas' },
  { name: 'El Salvador Gang Crisis', lat: 13.8, lng: -88.9, type: 'humanitarian', severity: 'high', value: 73, region: 'Americas' },
  { name: 'Nicaragua Political Crisis', lat: 12.9, lng: -85.2, type: 'political', severity: 'medium', value: 59, region: 'Americas' },
  { name: 'Haiti Kidnapping Crisis', lat: 18.9, lng: -72.3, type: 'humanitarian', severity: 'high', value: 74, region: 'Americas' },
  { name: 'Jamaica Gang Warfare', lat: 18.1, lng: -77.3, type: 'humanitarian', severity: 'medium', value: 64, region: 'Americas' },
  { name: 'Brazil Slum Violence', lat: -14.2, lng: -51.9, type: 'humanitarian', severity: 'medium', value: 63, region: 'Americas' },
  { name: 'Peru Indigenous Conflict', lat: -9.2, lng: -75.0, type: 'conflict', severity: 'medium', value: 57, region: 'Americas' },
  { name: 'Bolivia Political Unrest', lat: -16.3, lng: -63.6, type: 'political', severity: 'medium', value: 55, region: 'Americas' },
  { name: 'Ecuador Prison Violence', lat: -1.8, lng: -78.2, type: 'humanitarian', severity: 'high', value: 70, region: 'Americas' },
  { name: 'Argentina Economic Crisis', lat: -38.4, lng: -63.6, type: 'economic', severity: 'medium', value: 62, region: 'Americas' },
  { name: 'Chile Social Unrest', lat: -35.7, lng: -71.5, type: 'political', severity: 'low', value: 46, region: 'Americas' },
];

const SAMPLE_CLIMATE_REGIONS: ClimateRegion[] = [
  // Asia-Pacific Critical Regions (30)
  { region: 'South Asia Plains', temp: '+2.5°C', drought: 'High', flood: 'Critical', cropRisk: 85 },
  { region: 'Indo-Gangetic Plains', temp: '+2.9°C', drought: 'High', flood: 'Critical', cropRisk: 88 },
  { region: 'Deccan Plateau India', temp: '+2.8°C', drought: 'High', flood: 'Moderate', cropRisk: 79 },
  { region: 'Thar Desert', temp: '+3.2°C', drought: 'Critical', flood: 'Low', cropRisk: 94 },
  { region: 'Ganges Valley', temp: '+2.7°C', drought: 'High', flood: 'Critical', cropRisk: 87 },
  { region: 'Kashmir Valley', temp: '+3.0°C', drought: 'High', flood: 'High', cropRisk: 76 },
  { region: 'Brahmaputra Valley', temp: '+2.6°C', drought: 'Moderate', flood: 'Critical', cropRisk: 85 },
  { region: 'Bangladesh Delta', temp: '+2.6°C', drought: 'Moderate', flood: 'Critical', cropRisk: 86 },
  { region: 'Mekong Delta', temp: '+2.2°C', drought: 'Moderate', flood: 'Critical', cropRisk: 84 },
  { region: 'Southeast Asia Monsoon', temp: '+2.0°C', drought: 'Moderate', flood: 'Critical', cropRisk: 78 },
  { region: 'Irrawaddy Delta', temp: '+2.3°C', drought: 'Moderate', flood: 'Critical', cropRisk: 82 },
  { region: 'Chao Phraya Basin', temp: '+2.2°C', drought: 'Moderate', flood: 'Critical', cropRisk: 81 },
  { region: 'Red River Delta Vietnam', temp: '+2.1°C', drought: 'Moderate', flood: 'Critical', cropRisk: 80 },
  { region: 'East China Plains', temp: '+2.6°C', drought: 'High', flood: 'High', cropRisk: 75 },
  { region: 'Yangtze River Basin', temp: '+2.3°C', drought: 'Moderate', flood: 'High', cropRisk: 72 },
  { region: 'Pearl River Delta', temp: '+2.1°C', drought: 'Moderate', flood: 'High', cropRisk: 70 },
  { region: 'Central Asia Steppe', temp: '+2.8°C', drought: 'Critical', flood: 'Moderate', cropRisk: 87 },
  { region: 'Tarim Basin', temp: '+3.0°C', drought: 'Critical', flood: 'Low', cropRisk: 92 },
  { region: 'Gobi Desert Region', temp: '+3.3°C', drought: 'Critical', flood: 'Low', cropRisk: 95 },
  { region: 'Himalayan Region', temp: '+3.2°C', drought: 'High', flood: 'High', cropRisk: 81 },
  { region: 'Tibetan Plateau', temp: '+3.8°C', drought: 'Moderate', flood: 'Moderate', cropRisk: 58 },
  { region: 'Philippine Islands', temp: '+2.0°C', drought: 'Moderate', flood: 'Critical', cropRisk: 79 },
  { region: 'Indonesian Archipelago', temp: '+1.9°C', drought: 'Moderate', flood: 'Critical', cropRisk: 77 },
  { region: 'Java Island Lowlands', temp: '+2.0°C', drought: 'Moderate', flood: 'Critical', cropRisk: 78 },
  { region: 'Borneo Rainforest', temp: '+1.8°C', drought: 'Low', flood: 'Critical', cropRisk: 73 },
  { region: 'Sumatra Tropical', temp: '+1.9°C', drought: 'Low', flood: 'Critical', cropRisk: 74 },
  { region: 'Papua New Guinea Rainforest', temp: '+2.1°C', drought: 'Low', flood: 'Critical', cropRisk: 71 },
  { region: 'Korean Peninsula', temp: '+2.5°C', drought: 'Moderate', flood: 'Moderate', cropRisk: 65 },
  { region: 'Japanese Islands', temp: '+2.2°C', drought: 'Low', flood: 'Critical', cropRisk: 68 },
  { region: 'Mongolia Steppe', temp: '+3.1°C', drought: 'Critical', flood: 'Moderate', cropRisk: 90 },

  // Africa High-Risk Regions (35)
  { region: 'North Africa Sahara', temp: '+3.1°C', drought: 'Critical', flood: 'Moderate', cropRisk: 95 },
  { region: 'Sahel Zone', temp: '+3.0°C', drought: 'Critical', flood: 'Moderate', cropRisk: 92 },
  { region: 'Sub-Saharan Africa', temp: '+2.8°C', drought: 'Critical', flood: 'High', cropRisk: 91 },
  { region: 'West Africa Savanna', temp: '+2.7°C', drought: 'High', flood: 'Critical', cropRisk: 84 },
  { region: 'East Africa Horn', temp: '+2.6°C', drought: 'Critical', flood: 'Moderate', cropRisk: 89 },
  { region: 'Southern Africa Savanna', temp: '+2.3°C', drought: 'High', flood: 'Moderate', cropRisk: 78 },
  { region: 'Egyptian Nile Valley', temp: '+3.3°C', drought: 'Critical', flood: 'Low', cropRisk: 90 },
  { region: 'Moroccan Atlas', temp: '+2.9°C', drought: 'High', flood: 'Moderate', cropRisk: 79 },
  { region: 'Libyan Desert', temp: '+3.5°C', drought: 'Critical', flood: 'Low', cropRisk: 98 },
  { region: 'Sudan Arid', temp: '+3.2°C', drought: 'Critical', flood: 'Moderate', cropRisk: 91 },
  { region: 'Ethiopian Highlands', temp: '+2.7°C', drought: 'High', flood: 'Moderate', cropRisk: 82 },
  { region: 'Kenya Rift Valley', temp: '+2.8°C', drought: 'Critical', flood: 'Moderate', cropRisk: 87 },
  { region: 'Tanzania Plateau', temp: '+2.5°C', drought: 'Moderate', flood: 'Moderate', cropRisk: 75 },
  { region: 'Uganda Highlands', temp: '+2.3°C', drought: 'Moderate', flood: 'High', cropRisk: 73 },
  { region: 'DRC Congo Basin', temp: '+2.2°C', drought: 'Low', flood: 'Critical', cropRisk: 76 },
  { region: 'Zambian Miombo', temp: '+2.4°C', drought: 'High', flood: 'Moderate', cropRisk: 79 },
  { region: 'Zimbabwe Plateau', temp: '+2.6°C', drought: 'Critical', flood: 'Moderate', cropRisk: 84 },
  { region: 'Botswana Kalahari', temp: '+2.7°C', drought: 'Critical', flood: 'Low', cropRisk: 89 },
  { region: 'South Africa Veld', temp: '+2.2°C', drought: 'High', flood: 'Moderate', cropRisk: 76 },
  { region: 'Madagascar Island', temp: '+2.1°C', drought: 'Moderate', flood: 'Critical', cropRisk: 78 },
  { region: 'Senegal River Valley', temp: '+2.9°C', drought: 'Critical', flood: 'Moderate', cropRisk: 88 },
  { region: 'Mali Desert Transition', temp: '+3.1°C', drought: 'Critical', flood: 'Moderate', cropRisk: 93 },
  { region: 'Niger Sahara', temp: '+3.2°C', drought: 'Critical', flood: 'Low', cropRisk: 94 },
  { region: 'Lake Chad Region', temp: '+3.0°C', drought: 'Critical', flood: 'Moderate', cropRisk: 91 },
  { region: 'Cameroon Highlands', temp: '+2.3°C', drought: 'Moderate', flood: 'High', cropRisk: 73 },
  { region: 'Nigeria Savanna', temp: '+2.6°C', drought: 'High', flood: 'High', cropRisk: 80 },
  { region: 'Ghana Coastal Belt', temp: '+2.2°C', drought: 'Moderate', flood: 'Moderate', cropRisk: 71 },
  { region: 'Ivory Coast Rainforest', temp: '+2.0°C', drought: 'Moderate', flood: 'Critical', cropRisk: 75 },
  { region: 'Angola Dry Savanna', temp: '+2.5°C', drought: 'High', flood: 'Moderate', cropRisk: 81 },
  { region: 'Mozambique Coastal', temp: '+2.3°C', drought: 'Moderate', flood: 'High', cropRisk: 77 },
  { region: 'Malawi Rift Valley', temp: '+2.4°C', drought: 'Moderate', flood: 'Moderate', cropRisk: 74 },
  { region: 'Rwanda Highlands', temp: '+2.1°C', drought: 'Moderate', flood: 'High', cropRisk: 70 },
  { region: 'Burundi Plateau', temp: '+2.2°C', drought: 'Moderate', flood: 'Moderate', cropRisk: 68 },
  { region: 'Namibia Desert', temp: '+2.8°C', drought: 'Critical', flood: 'Low', cropRisk: 92 },
  { region: 'Lesotho Highlands', temp: '+2.1°C', drought: 'High', flood: 'High', cropRisk: 72 },

  // Americas High-Risk (20)
  { region: 'Central America', temp: '+2.4°C', drought: 'High', flood: 'High', cropRisk: 79 },
  { region: 'North America', temp: '+2.0°C', drought: 'High', flood: 'Moderate', cropRisk: 65 },
  { region: 'South America', temp: '+2.2°C', drought: 'Moderate', flood: 'High', cropRisk: 71 },
  { region: 'Caribbean Region', temp: '+2.3°C', drought: 'Moderate', flood: 'Critical', cropRisk: 77 },
  { region: 'Amazon Basin', temp: '+2.4°C', drought: 'Moderate', flood: 'High', cropRisk: 74 },
  { region: 'Andes Mountains', temp: '+2.5°C', drought: 'High', flood: 'High', cropRisk: 80 },
  { region: 'Brazilian Cerrado', temp: '+2.5°C', drought: 'High', flood: 'Moderate', cropRisk: 78 },
  { region: 'Pampas Region', temp: '+2.1°C', drought: 'Moderate', flood: 'Moderate', cropRisk: 66 },
  { region: 'Gran Chaco', temp: '+2.6°C', drought: 'High', flood: 'Moderate', cropRisk: 79 },
  { region: 'Atacama Desert', temp: '+2.3°C', drought: 'Critical', flood: 'Low', cropRisk: 91 },
  { region: 'Central Valley California', temp: '+2.1°C', drought: 'Critical', flood: 'Moderate', cropRisk: 85 },
  { region: 'Great Plains USA', temp: '+2.3°C', drought: 'High', flood: 'Moderate', cropRisk: 71 },
  { region: 'Corn Belt', temp: '+2.0°C', drought: 'Moderate', flood: 'Moderate', cropRisk: 64 },
  { region: 'Mexico Plateau', temp: '+2.4°C', drought: 'High', flood: 'Moderate', cropRisk: 77 },
  { region: 'Colombian Highlands', temp: '+2.3°C', drought: 'Moderate', flood: 'Critical', cropRisk: 76 },
  { region: 'Peruvian Altiplano', temp: '+2.4°C', drought: 'High', flood: 'Moderate', cropRisk: 79 },
  { region: 'Venezuelan Llanos', temp: '+2.3°C', drought: 'High', flood: 'High', cropRisk: 78 },
  { region: 'Paraguay Agricultural Zone', temp: '+2.2°C', drought: 'Moderate', flood: 'High', cropRisk: 73 },
  { region: 'Patagonia', temp: '+1.8°C', drought: 'Moderate', flood: 'Moderate', cropRisk: 61 },
  { region: 'Central American Isthmus', temp: '+2.2°C', drought: 'Moderate', flood: 'Critical', cropRisk: 81 },

  // Europe Moderate Regions (18)
  { region: 'Europe Continental', temp: '+1.9°C', drought: 'Moderate', flood: 'Moderate', cropRisk: 55 },
  { region: 'Northern Europe', temp: '+1.5°C', drought: 'Low', flood: 'High', cropRisk: 48 },
  { region: 'Eastern Europe', temp: '+2.1°C', drought: 'Moderate', flood: 'Moderate', cropRisk: 61 },
  { region: 'Mediterranean Basin', temp: '+2.6°C', drought: 'High', flood: 'Moderate', cropRisk: 75 },
  { region: 'Atlantic Europe', temp: '+1.7°C', drought: 'Low', flood: 'Moderate', cropRisk: 51 },
  { region: 'Alpine Region', temp: '+2.4°C', drought: 'Low', flood: 'High', cropRisk: 57 },
  { region: 'Balkans', temp: '+2.2°C', drought: 'Moderate', flood: 'High', cropRisk: 63 },
  { region: 'Carpathian Basin', temp: '+2.0°C', drought: 'Moderate', flood: 'Moderate', cropRisk: 59 },
  { region: 'Polish Lowlands', temp: '+1.8°C', drought: 'Moderate', flood: 'Moderate', cropRisk: 54 },
  { region: 'Iberian Peninsula', temp: '+2.7°C', drought: 'High', flood: 'Moderate', cropRisk: 74 },
  { region: 'Black Sea Region', temp: '+2.3°C', drought: 'Moderate', flood: 'High', cropRisk: 65 },
  { region: 'Danube Basin', temp: '+2.1°C', drought: 'Moderate', flood: 'High', cropRisk: 62 },
  { region: 'Russian Steppe', temp: '+2.5°C', drought: 'High', flood: 'Moderate', cropRisk: 71 },
  { region: 'Caucasus Mountains', temp: '+2.4°C', drought: 'Moderate', flood: 'High', cropRisk: 68 },
  { region: 'North Sea Region', temp: '+1.6°C', drought: 'Low', flood: 'High', cropRisk: 55 },
  { region: 'Central European Lowlands', temp: '+2.0°C', drought: 'Moderate', flood: 'Moderate', cropRisk: 60 },
  { region: 'Scandinavian Boreal', temp: '+2.2°C', drought: 'Low', flood: 'Moderate', cropRisk: 53 },
  { region: 'Siberian Arctic', temp: '+3.8°C', drought: 'Moderate', flood: 'High', cropRisk: 71 },

  // Additional Global Coverage (5)
  { region: 'Middle East Arid', temp: '+3.2°C', drought: 'Critical', flood: 'Low', cropRisk: 96 },
  { region: 'Persian Gulf Coast', temp: '+3.0°C', drought: 'Critical', flood: 'Low', cropRisk: 94 },
  { region: 'Oceania Pacific Islands', temp: '+2.0°C', drought: 'Moderate', flood: 'Critical', cropRisk: 77 },
  { region: 'Australia Outback', temp: '+2.4°C', drought: 'Critical', flood: 'Low', cropRisk: 94 },
  { region: 'New Zealand Temperate', temp: '+1.8°C', drought: 'Low', flood: 'Moderate', cropRisk: 52 },
];

const SAMPLE_INCIDENTS: Incident[] = [
  // Recent Military/Conflict Incidents (30)
  { name: 'Border Skirmish Pakistan-Afghanistan', lat: 34.5, lng: 69.1, type: 'military', date: '2026-03-20' },
  { name: 'Naval Incident Taiwan Strait', lat: 24.0, lng: 119.5, type: 'military', date: '2026-03-20' },
  { name: 'Cyber Attack Ukraine Infrastructure', lat: 50.4, lng: 30.5, type: 'cyber', date: '2026-03-19' },
  { name: 'Conflict Mali-Burkina Border', lat: 15.5, lng: -2.0, type: 'military', date: '2026-03-19' },
  { name: 'Syria-Turkey Border Bombing', lat: 36.5, lng: 36.0, type: 'military', date: '2026-03-18' },
  { name: 'Yemen Houthi Attack Port', lat: 16.0, lng: 48.0, type: 'military', date: '2026-03-18' },
  { name: 'Iraq-US Military Action', lat: 33.3, lng: 44.4, type: 'military', date: '2026-03-17' },
  { name: 'Israeli Strike Gaza', lat: 31.9, lng: 35.2, type: 'military', date: '2026-03-17' },
  { name: 'DRC Armed Group Clash', lat: -4.0, lng: 21.7, type: 'military', date: '2026-03-16' },
  { name: 'North Korea Missile Test', lat: 40.3, lng: 127.5, type: 'military', date: '2026-03-16' },
  { name: 'Indian-China Border Skirmish', lat: 35.0, lng: 77.5, type: 'military', date: '2026-03-15' },
  { name: 'Philippines-China South China Sea', lat: 14.0, lng: 118.0, type: 'territorial', date: '2026-03-15' },
  { name: 'Kenya-Somalia Border Incident', lat: 0.0, lng: 42.0, type: 'military', date: '2026-03-14' },
  { name: 'Ethiopia-Eritrea Tensions', lat: 14.5, lng: 39.0, type: 'military', date: '2026-03-14' },
  { name: 'Libya-Tunisia Border Clashes', lat: 32.5, lng: 10.5, type: 'military', date: '2026-03-13' },
  { name: 'Colombia-Ecuador Drug Cartel Battle', lat: 1.0, lng: -74.0, type: 'military', date: '2026-03-13' },
  { name: 'Venezuela-Guyana EEZ Dispute', lat: 8.0, lng: -58.0, type: 'territorial', date: '2026-03-12' },
  { name: 'Mexico-Central America Gang War', lat: 15.0, lng: -90.0, type: 'military', date: '2026-03-12' },
  { name: 'Afghanistan-Pakistan Cross-Border Attack', lat: 34.0, lng: 71.0, type: 'military', date: '2026-03-11' },
  { name: 'Russia-Ukraine Artillery Exchange', lat: 48.0, lng: 36.0, type: 'military', date: '2026-03-11' },
  { name: 'Nagorno-Karabakh Flare-up', lat: 40.2, lng: 46.8, type: 'military', date: '2026-03-10' },
  { name: 'Turkey-PKK Cross-Border Operation', lat: 37.5, lng: 44.0, type: 'military', date: '2026-03-10' },
  { name: 'Thailand-Cambodia Border Dispute', lat: 13.5, lng: 105.0, type: 'territorial', date: '2026-03-09' },
  { name: 'Myanmar-Thailand Border Clash', lat: 19.0, lng: 98.0, type: 'military', date: '2026-03-09' },
  { name: 'Chad-Libya Armed Incursion', lat: 17.0, lng: 20.0, type: 'military', date: '2026-03-08' },
  { name: 'Cameroon-Nigeria Maritime Dispute', lat: 5.0, lng: 9.5, type: 'territorial', date: '2026-03-08' },
  { name: 'South Sudan-Uganda Border Tension', lat: 4.0, lng: 33.0, type: 'military', date: '2026-03-07' },
  { name: 'Russia-Georgia Air Incident', lat: 42.0, lng: 44.0, type: 'military', date: '2026-03-07' },
  { name: 'Belarus-Poland Border Crisis', lat: 54.0, lng: 25.0, type: 'humanitarian', date: '2026-03-06' },
  { name: 'Kyrgyzstan-Tajikistan Artillery Exchange', lat: 37.5, lng: 72.5, type: 'military', date: '2026-03-06' },

  // Humanitarian/Refugee Crisis (25)
  { name: 'Refugee Crisis Syria', lat: 34.8, lng: 38.9, type: 'humanitarian', date: '2026-03-20' },
  { name: 'Famine Horn of Africa', lat: 8.0, lng: 46.0, type: 'humanitarian', date: '2026-03-19' },
  { name: 'Cholera Outbreak Yemen', lat: 15.5, lng: 48.5, type: 'humanitarian', date: '2026-03-18' },
  { name: 'Hurricane Devastation Central America', lat: 15.0, lng: -89.0, type: 'natural', date: '2026-03-17' },
  { name: 'Ebola Cases DRC', lat: -4.0, lng: 21.7, type: 'humanitarian', date: '2026-03-16' },
  { name: 'Malaria Surge Sub-Saharan Africa', lat: 0.0, lng: 20.0, type: 'humanitarian', date: '2026-03-15' },
  { name: 'Typhoon Philippines', lat: 12.9, lng: 121.8, type: 'natural', date: '2026-03-14' },
  { name: 'Earthquake Turkey-Syria Region', lat: 37.2, lng: 37.0, type: 'natural', date: '2026-03-13' },
  { name: 'Flood Pakistan', lat: 30.0, lng: 70.0, type: 'natural', date: '2026-03-12' },
  { name: 'Drought Sub-Saharan', lat: 0.0, lng: 15.0, type: 'environmental', date: '2026-03-11' },
  { name: 'Tsunami Alert Indian Ocean', lat: 0.0, lng: 80.0, type: 'natural', date: '2026-03-10' },
  { name: 'Wildfire Australia', lat: -25.3, lng: 133.8, type: 'natural', date: '2026-03-09' },
  { name: 'Displacement South Sudan', lat: 6.9, lng: 31.3, type: 'humanitarian', date: '2026-03-08' },
  { name: 'Refugee Camps Turkey-Syria', lat: 36.5, lng: 36.8, type: 'humanitarian', date: '2026-03-07' },
  { name: 'Child Malnutrition Angola', lat: -11.2, lng: 17.9, type: 'humanitarian', date: '2026-03-06' },
  { name: 'Migration Crisis Mexico-USA', lat: 28.0, lng: -103.0, type: 'humanitarian', date: '2026-03-05' },
  { name: 'Trafficking Ring Balkans', lat: 42.0, lng: 20.0, type: 'humanitarian', date: '2026-03-04' },
  { name: 'IDP Crisis Mozambique', lat: -18.7, lng: 35.3, type: 'humanitarian', date: '2026-03-03' },
  { name: 'Landmine Casualties Cambodia', lat: 12.5, lng: 104.9, type: 'humanitarian', date: '2026-03-02' },
  { name: 'Water Crisis Sub-Saharan', lat: 0.0, lng: 20.0, type: 'environmental', date: '2026-03-01' },
  { name: 'Sanitation Outbreak Haiti', lat: 18.9, lng: -72.3, type: 'humanitarian', date: '2026-02-28' },
  { name: 'Healthcare Collapse Venezuela', lat: 6.4, lng: -66.6, type: 'humanitarian', date: '2026-02-27' },
  { name: 'Child Soldiers Recruitment Uganda', lat: 1.4, lng: 32.3, type: 'humanitarian', date: '2026-02-26' },
  { name: 'Forced Labor Burma', lat: 21.9, lng: 95.9, type: 'humanitarian', date: '2026-02-25' },
  { name: 'Gender-Based Violence DRC', lat: -4.0, lng: 21.7, type: 'humanitarian', date: '2026-02-24' },

  // Political/Economic Incidents (25)
  { name: 'Protest Movement Hong Kong', lat: 22.3, lng: 114.2, type: 'political', date: '2026-03-20' },
  { name: 'Election Violence Zimbabwe', lat: -19.0, lng: 29.1, type: 'political', date: '2026-03-19' },
  { name: 'Constitutional Crisis Nicaragua', lat: 12.9, lng: -85.2, type: 'political', date: '2026-03-18' },
  { name: 'Currency Collapse Argentina', lat: -38.4, lng: -63.6, type: 'economic', date: '2026-03-17' },
  { name: 'Strike Action Brazil', lat: -14.2, lng: -51.9, type: 'political', date: '2026-03-16' },
  { name: 'Coup Attempt Guinea', lat: 9.9, lng: -9.6, type: 'political', date: '2026-03-15' },
  { name: 'Labor Unrest Thailand', lat: 15.9, lng: 100.9, type: 'political', date: '2026-03-14' },
  { name: 'Tax Protest France', lat: 46.2, lng: 2.2, type: 'political', date: '2026-03-13' },
  { name: 'Banking Crisis Greece', lat: 39.1, lng: 21.8, type: 'economic', date: '2026-03-12' },
  { name: 'Trade War Escalation USA-China', lat: 39.9, lng: 116.4, type: 'economic', date: '2026-03-11' },
  { name: 'Sanctions Impact Russia', lat: 55.7, lng: 37.6, type: 'economic', date: '2026-03-10' },
  { name: 'Inflation Crisis Turkey', lat: 38.9, lng: 35.2, type: 'economic', date: '2026-03-09' },
  { name: 'Unemployment Surge Spain', lat: 40.4, lng: -3.7, type: 'economic', date: '2026-03-08' },
  { name: 'Oil Price Volatility OPEC', lat: 24.5, lng: 46.7, type: 'economic', date: '2026-03-07' },
  { name: 'Sovereign Debt Crisis Lebanon', lat: 33.8, lng: 35.9, type: 'economic', date: '2026-03-06' },
  { name: 'Pension Reform Unrest France', lat: 48.8, lng: 2.3, type: 'political', date: '2026-03-05' },
  { name: 'Corruption Scandal Nigeria', lat: 9.0, lng: 8.7, type: 'political', date: '2026-03-04' },
  { name: 'Drug Cartel Violence Mexico', lat: 23.6, lng: -102.5, type: 'criminal', date: '2026-03-03' },
  { name: 'Gang Warfare El Salvador', lat: 13.8, lng: -88.9, type: 'criminal', date: '2026-03-02' },
  { name: 'Human Rights Violations Belarus', lat: 53.7, lng: 27.9, type: 'political', date: '2026-03-01' },
  { name: 'Judicial Crisis Poland', lat: 51.9, lng: 19.1, type: 'political', date: '2026-02-28' },
  { name: 'Media Crackdown Egypt', lat: 30.0, lng: 31.2, type: 'political', date: '2026-02-27' },
  { name: 'Indigenous Rights Conflict Peru', lat: -9.2, lng: -75.0, type: 'political', date: '2026-02-26' },
  { name: 'Land Dispute Zimbabwe', lat: -17.8, lng: 31.0, type: 'political', date: '2026-02-25' },
  { name: 'Minority Grievance Myanmar', lat: 21.9, lng: 95.9, type: 'political', date: '2026-02-24' },

  // Criminal/Security Incidents (16)
  { name: 'Kidnapping Crisis Haiti', lat: 18.9, lng: -72.3, type: 'criminal', date: '2026-03-19' },
  { name: 'Piracy Somalia', lat: 5.1, lng: 46.2, type: 'criminal', date: '2026-03-18' },
  { name: 'Human Trafficking Bangkok', lat: 13.7, lng: 100.5, type: 'criminal', date: '2026-03-17' },
  { name: 'Drug Smuggling Colombia', lat: 4.6, lng: -74.3, type: 'criminal', date: '2026-03-16' },
  { name: 'Organized Crime Manila', lat: 14.6, lng: 121.0, type: 'criminal', date: '2026-03-15' },
  { name: 'Gang Shooting Los Angeles', lat: 34.0, lng: -118.2, type: 'criminal', date: '2026-03-14' },
  { name: 'Arms Trafficking Libya', lat: 32.9, lng: 13.2, type: 'criminal', date: '2026-03-13' },
  { name: 'Extortion Cartel Mexico', lat: 25.3, lng: -103.6, type: 'criminal', date: '2026-03-12' },
  { name: 'Identity Theft Network', lat: 51.5, lng: -0.1, type: 'cyber', date: '2026-03-11' },
  { name: 'Counterfeiting Operation Turkey', lat: 41.0, lng: 28.9, type: 'criminal', date: '2026-03-10' },
  { name: 'Money Laundering Dubai', lat: 25.2, lng: 55.2, type: 'criminal', date: '2026-03-09' },
  { name: 'Corruption Charges Ukraine', lat: 50.4, lng: 30.5, type: 'criminal', date: '2026-03-08' },
  { name: 'Bribery Investigation India', lat: 28.6, lng: 77.2, type: 'criminal', date: '2026-03-07' },
  { name: 'Fraud Case Singapore', lat: 1.4, lng: 103.8, type: 'criminal', date: '2026-03-06' },
  { name: 'Sex Trafficking Ring Thailand', lat: 18.8, lng: 98.9, type: 'criminal', date: '2026-03-05' },
  { name: 'Cyber Heist Korea', lat: 37.5, lng: 126.9, type: 'cyber', date: '2026-03-04' },
];

const SAMPLE_ECONOMIC_REGIONS: EconomicRegion[] = [
  {
    name: 'Asia-Pacific',
    gdp_usd_trillion: 35.2,
    gdp_growth_percent: 4.8,
    population_billion: 4.3,
    employment_rate: 62.5,
    unemployment_rate: 5.1,
    major_industries: [
      { name: 'Technology', percentage: 28, value_usd_billion: 9856 },
      { name: 'Manufacturing', percentage: 24, value_usd_billion: 8448 },
    ],
    agriculture_zones: [
      { zone: 'Monsoon Belt', countries: ['India', 'Bangladesh'], crops: ['Rice', 'Wheat'], production_million_tons: 450, employment_percent: 42 },
    ],
  },
  {
    name: 'Europe',
    gdp_usd_trillion: 22.8,
    gdp_growth_percent: 1.9,
    population_billion: 0.75,
    employment_rate: 68.2,
    unemployment_rate: 6.3,
    major_industries: [
      { name: 'Services', percentage: 72, value_usd_billion: 16416 },
      { name: 'Manufacturing', percentage: 18, value_usd_billion: 4104 },
    ],
    agriculture_zones: [
      { zone: 'Mediterranean', countries: ['Spain', 'Italy', 'Greece'], crops: ['Olives', 'Wine Grapes'], production_million_tons: 120, employment_percent: 8 },
    ],
  },
];

export function useGeospatialMetrics() {
  const [data, setData] = useState<GeospatialMetrics>({
    hotspots: SAMPLE_HOTSPOTS,
    climateRegions: SAMPLE_CLIMATE_REGIONS,
    incidents: SAMPLE_INCIDENTS,
    economicRegions: SAMPLE_ECONOMIC_REGIONS,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [hotspotsResult, climateResult, incidentsResult, economicResult] = await Promise.allSettled([
          apiGet<{ hotspots: Hotspot[] }>('/api/geospatial/hotspots'),
          apiGet<{ regions: ClimateRegion[] }>('/api/geospatial/climate-indicators'),
          apiGet<{ incidents: Incident[] }>('/api/geospatial/incidents/global'),
          apiGet<{ regions: EconomicRegion[] }>('/api/geospatial/economic-activity'),
        ]);

        if (!active) return;

        const hotspots = hotspotsResult.status === 'fulfilled' && hotspotsResult.value?.hotspots
          ? hotspotsResult.value.hotspots
          : SAMPLE_HOTSPOTS;
        const climateRegions = climateResult.status === 'fulfilled' && climateResult.value?.regions
          ? climateResult.value.regions
          : SAMPLE_CLIMATE_REGIONS;
        const incidents = incidentsResult.status === 'fulfilled' && incidentsResult.value?.incidents
          ? incidentsResult.value.incidents
          : SAMPLE_INCIDENTS;
        const economicRegions = economicResult.status === 'fulfilled' && economicResult.value?.regions
          ? economicResult.value.regions
          : SAMPLE_ECONOMIC_REGIONS;
        
        const isUsingFallback = hotspotsResult.status === 'rejected' || climateResult.status === 'rejected' 
          || incidentsResult.status === 'rejected' || economicResult.status === 'rejected';

        setData({
          hotspots,
          climateRegions,
          incidents,
          economicRegions,
        });
        setError(isUsingFallback ? 'Live geospatial data are unavailable. Displaying sample data.' : null);
      } catch (err) {
        if (!active) return;
        setData({
          hotspots: SAMPLE_HOTSPOTS,
          climateRegions: SAMPLE_CLIMATE_REGIONS,
          incidents: SAMPLE_INCIDENTS,
          economicRegions: SAMPLE_ECONOMIC_REGIONS,
        });
        setError(err instanceof Error ? err.message : 'Failed to load geospatial metrics. Displaying sample data.');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return { data, loading, error };
}
