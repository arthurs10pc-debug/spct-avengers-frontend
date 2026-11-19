import React, { useState, useEffect, useCallback } from 'react';
import { X, RotateCw, Coins, Fuel, Calculator, TrendingUp, Sparkles, CheckCircle2, ShieldCheck, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function GujaratRatesModal({ isOpen, onClose, backendUrl }) {
  const [activeTab, setActiveTab] = useState('gold'); // 'gold' | 'fuel' | 'calculator'
  const [ratesData, setRatesData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState('');
  const [selectedCity, setSelectedCity] = useState('ahmedabad');

  // Calculator states
  const [calcKarat, setCalcKarat] = useState('22');
  const [calcGrams, setCalcGrams] = useState(10);
  const [calcMakingPercent, setCalcMakingPercent] = useState(8);

  const [fuelType, setFuelType] = useState('petrol');
  const [fuelCity, setFuelCity] = useState('ahmedabad');
  const [tripDistanceKm, setTripDistanceKm] = useState(100);
  const [vehicleMileage, setVehicleMileage] = useState(16);

  const fetchRates = useCallback(async (force = false) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/gujarat/live-rates${force ? '?refresh=true' : ''}`);
      if (res.ok) {
        const data = await res.json();
        setRatesData(data);
        setLastRefreshed(data.lastUpdated || new Date().toLocaleTimeString('en-IN'));
      }
    } catch (e) {
      console.warn("Could not fetch remote rates, using local fallback", e);
    } finally {
      setIsLoading(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    if (isOpen) {
      fetchRates(false);
    }
  }, [isOpen, fetchRates]);

  if (!isOpen) return null;

  // Fallback defaults if offline (Source: Ahmedabad Bullion Association / Groww)
  const goldRates = ratesData?.gold?.rates || [
    { karat: '24 Karat', purity: '99.9% Pure Gold', price10g: 130740, price1g: 13074, changeToday: '-₹257/g', trend: 'down', badge: 'BIS 999 Fine Gold' },
    { karat: '22 Karat', purity: '91.6% Hallmark Jewelry Gold', price10g: 119850, price1g: 11985, changeToday: '-₹235/g', trend: 'down', badge: 'BIS 916 Hallmark' },
    { karat: '18 Karat', purity: '75.0% Diamond Jewelry Gold', price10g: 98060, price1g: 9806, changeToday: '-₹192/g', trend: 'down', badge: 'BIS 750 Hallmark' }
  ];

  const silverData = ratesData?.silver || {
    price1kg: 194000,
    price10g: 1940,
    price100g: 19400,
    changeToday: '+₹1,200',
    trend: 'up',
    badge: '999 Pure Silver'
  };

  const fuelCities = ratesData?.fuel || {
    ahmedabad: { city: 'Ahmedabad', petrol: 94.44, diesel: 90.11, cng: 76.50, changePetrol: '₹0.00 (Unchanged)', status: '🟢 Daily Revision 06:00 AM' },
    surat: { city: 'Surat', petrol: 94.31, diesel: 89.98, cng: 76.25, changePetrol: '₹0.00 (Unchanged)', status: '🟢 Daily Revision' },
    vadodara: { city: 'Vadodara', petrol: 94.08, diesel: 89.74, cng: 75.90, changePetrol: '₹0.00 (Unchanged)', status: '🟢 Daily Revision' },
    rajkot: { city: 'Rajkot', petrol: 94.24, diesel: 89.92, cng: 76.30, changePetrol: '₹0.00 (Unchanged)', status: '🟢 Daily Revision' },
    gandhinagar: { city: 'Gandhinagar', petrol: 94.52, diesel: 90.19, cng: 76.60, changePetrol: '₹0.00 (Unchanged)', status: '🟢 Daily Revision' }
  };

  // Calculations
  const selectedGoldObj = goldRates.find(r => r.karat.startsWith(calcKarat)) || goldRates[1];
  const baseGoldPrice = (selectedGoldObj?.price1g || 7001) * Math.max(0.1, Number(calcGrams) || 0);
  const makingCharges = baseGoldPrice * ((Number(calcMakingPercent) || 0) / 100);
  const gstAmount = (baseGoldPrice + makingCharges) * 0.03;
  const totalGoldPayable = Math.round(baseGoldPrice + makingCharges + gstAmount);

  const selectedFuelCityObj = fuelCities[fuelCity] || fuelCities.ahmedabad;
  const currentFuelPricePerL = fuelType === 'petrol' ? selectedFuelCityObj.petrol : fuelType === 'diesel' ? selectedFuelCityObj.diesel : selectedFuelCityObj.cng;
  const fuelNeededLiters = (Math.max(1, Number(tripDistanceKm) || 0) / Math.max(1, Number(vehicleMileage) || 1));
  const totalTripFuelCost = Math.round(fuelNeededLiters * currentFuelPricePerL);

  return (
    <div 
      className="rates-modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 8, 15, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div 
        className="rates-modal-container"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          backgroundColor: '#0a0e17',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(245, 158, 11, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#ffffff',
          fontFamily: 'inherit'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(14, 165, 233, 0.05) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000000',
              boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)'
            }}>
              <Coins size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', letterSpacing: '-0.3px', color: '#ffffff' }}>
                  Gujarat & Ahmedabad Live Rates
                </h2>
                <span style={{
                  fontSize: '10px',
                  fontWeight: '800',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                  ● LIVE TODAY
                </span>
              </div>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                Gold 24K/22K Hallmark • Silver 999 • Petrol/Diesel • Last Sync: {lastRefreshed}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => fetchRates(true)}
              disabled={isLoading}
              title="Refresh Live Market Data"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: '800',
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              <RotateCw size={13} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
              {isLoading ? 'SYNCING...' : 'REFRESH'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: 'rgba(255, 255, 255, 0.06)',
                color: '#cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 24px',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('gold')}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '12px',
              border: activeTab === 'gold' ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid transparent',
              background: activeTab === 'gold' ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.15) 100%)' : 'rgba(255, 255, 255, 0.04)',
              color: activeTab === 'gold' ? '#f59e0b' : '#94a3b8',
              fontSize: '13px',
              fontWeight: '900',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              textTransform: 'uppercase'
            }}
          >
            <Coins size={16} />
            <span>🪙 Gold & Silver (Ahmedabad)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fuel')}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '12px',
              border: activeTab === 'fuel' ? '1px solid rgba(14, 165, 233, 0.5)' : '1px solid transparent',
              background: activeTab === 'fuel' ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.25) 0%, rgba(2, 132, 199, 0.15) 100%)' : 'rgba(255, 255, 255, 0.04)',
              color: activeTab === 'fuel' ? '#38bdf8' : '#94a3b8',
              fontSize: '13px',
              fontWeight: '900',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              textTransform: 'uppercase'
            }}
          >
            <Fuel size={16} />
            <span>⛽ Petrol & Diesel (Gujarat)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('calculator')}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '12px',
              border: activeTab === 'calculator' ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid transparent',
              background: activeTab === 'calculator' ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(147, 51, 234, 0.15) 100%)' : 'rgba(255, 255, 255, 0.04)',
              color: activeTab === 'calculator' ? '#c084fc' : '#94a3b8',
              fontSize: '13px',
              fontWeight: '900',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              textTransform: 'uppercase'
            }}
          >
            <Calculator size={16} />
            <span>🧮 Smart Price Calculators</span>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* TAB 1: GOLD & SILVER */}
          {activeTab === 'gold' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Gold Cards Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '14px'
              }}>
                {goldRates.map((g, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: idx === 0 
                        ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(180, 83, 9, 0.05) 100%)' 
                        : idx === 1 
                        ? 'linear-gradient(135deg, rgba(217, 119, 6, 0.12) 0%, rgba(146, 64, 14, 0.04) 100%)'
                        : 'rgba(255, 255, 255, 0.04)',
                      border: idx === 0 ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '16px',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: '900', color: '#f59e0b', textTransform: 'uppercase' }}>
                          {g.badge}
                        </span>
                        <h3 style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: '900', color: '#ffffff' }}>
                          {g.karat}
                        </h3>
                        <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                          {g.purity}
                        </span>
                      </div>
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        fontSize: '11px',
                        fontWeight: '900',
                        color: g.trend === 'up' ? '#10b981' : '#ef4444',
                        backgroundColor: g.trend === 'up' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        padding: '3px 7px',
                        borderRadius: '6px'
                      }}>
                        {g.trend === 'up' ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                        {g.changeToday}
                      </span>
                    </div>

                    <div style={{ marginTop: '6px' }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800' }}>
                        10 Grams Price
                      </span>
                      <div style={{ fontSize: '24px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.5px' }}>
                        ₹{g.price10g.toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '10px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      fontSize: '12px'
                    }}>
                      <span style={{ color: '#94a3b8' }}>1 Gram Retail:</span>
                      <strong style={{ color: '#fcd34d' }}>₹{g.price1g.toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                ))}
              </div>

              {/* Silver Section */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(148, 163, 184, 0.12) 0%, rgba(71, 85, 105, 0.05) 100%)',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '900', color: '#cbd5e1', backgroundColor: 'rgba(255, 255, 255, 0.08)', padding: '2px 8px', borderRadius: '4px' }}>
                      {silverData.badge}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#10b981' }}>
                      {silverData.changeToday} Today
                    </span>
                  </div>
                  <h3 style={{ margin: '6px 0 2px', fontSize: '20px', fontWeight: '900', color: '#ffffff' }}>
                    Silver Rate (Ahmedabad Bullion)
                  </h3>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {silverData.purity}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', fontWeight: '800' }}>
                      PER 1 KG
                    </span>
                    <span style={{ fontSize: '26px', fontWeight: '900', color: '#e2e8f0' }}>
                      ₹{silverData.price1kg.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div style={{ width: '1px', height: '40px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                  <div>
                    <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', fontWeight: '800' }}>
                      PER 100 GRAMS
                    </span>
                    <span style={{ fontSize: '20px', fontWeight: '900', color: '#94a3b8' }}>
                      ₹{silverData.price100g.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Verified Buying Notice */}
              <div style={{
                padding: '14px 18px',
                backgroundColor: 'rgba(245, 158, 11, 0.06)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <ShieldCheck size={24} color="#f59e0b" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '12px', color: '#fef3c7', lineHeight: '1.5' }}>
                  <strong>Ahmedabad Jewellers Association Rule:</strong> Always demand a 6-digit alphanumeric <strong>HUID (Hallmark Unique Identification)</strong> laser-inscribed code with BIS mark. GST rate on gold jewelry across Gujarat is standard 3% plus making charges.
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: FUEL (PETROL, DIESEL, CNG) */}
          {activeTab === 'fuel' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* City Selector */}
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {Object.keys(fuelCities).map((cKey) => {
                  const c = fuelCities[cKey];
                  const isSelected = selectedCity === cKey;
                  return (
                    <button
                      key={cKey}
                      type="button"
                      onClick={() => setSelectedCity(cKey)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '10px',
                        border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                        color: isSelected ? '#38bdf8' : '#94a3b8',
                        fontSize: '12px',
                        fontWeight: '900',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {c.city}
                    </button>
                  );
                })}
              </div>

              {/* Selected City Big Display */}
              {(() => {
                const cityObj = fuelCities[selectedCity] || fuelCities.ahmedabad;
                return (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '14px'
                  }}>
                    {/* Petrol */}
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(185, 28, 28, 0.04) 100%)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '16px',
                      padding: '18px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: '900', color: '#f87171', textTransform: 'uppercase' }}>
                          PETROL (REGULAR)
                        </span>
                        <span style={{ fontSize: '10px', backgroundColor: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', color: '#cbd5e1' }}>
                          {cityObj.city}
                        </span>
                      </div>
                      <div style={{ fontSize: '32px', fontWeight: '900', color: '#ffffff', margin: '10px 0 4px', letterSpacing: '-0.5px' }}>
                        ₹{cityObj.petrol.toFixed(2)}
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#94a3b8' }}> / Liter</span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '800' }}>
                        {cityObj.changePetrol}
                      </span>
                    </div>

                    {/* Diesel */}
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12) 0%, rgba(2, 132, 199, 0.04) 100%)',
                      border: '1px solid rgba(14, 165, 233, 0.3)',
                      borderRadius: '16px',
                      padding: '18px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: '900', color: '#38bdf8', textTransform: 'uppercase' }}>
                          DIESEL (AUTO)
                        </span>
                        <span style={{ fontSize: '10px', backgroundColor: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', color: '#cbd5e1' }}>
                          {cityObj.city}
                        </span>
                      </div>
                      <div style={{ fontSize: '32px', fontWeight: '900', color: '#ffffff', margin: '10px 0 4px', letterSpacing: '-0.5px' }}>
                        ₹{cityObj.diesel.toFixed(2)}
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#94a3b8' }}> / Liter</span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '800' }}>
                        {cityObj.changeDiesel || '₹0.00 (Unchanged)'}
                      </span>
                    </div>

                    {/* Auto CNG */}
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(4, 120, 87, 0.04) 100%)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '16px',
                      padding: '18px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: '900', color: '#34d399', textTransform: 'uppercase' }}>
                          AUTO CNG
                        </span>
                        <span style={{ fontSize: '10px', backgroundColor: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', color: '#cbd5e1' }}>
                          Gujarat Gas / Adani
                        </span>
                      </div>
                      <div style={{ fontSize: '32px', fontWeight: '900', color: '#ffffff', margin: '10px 0 4px', letterSpacing: '-0.5px' }}>
                        ₹{cityObj.cng.toFixed(2)}
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#94a3b8' }}> / Kg</span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '800' }}>
                        🟢 Active Pump Station Price
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* All Gujarat Cities Summary Table */}
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                overflow: 'hidden'
              }}>
                <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase' }}>
                    Comparison Across Major Gujarat Districts
                  </span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ color: '#94a3b8', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <th style={{ padding: '10px 16px' }}>District</th>
                        <th style={{ padding: '10px 16px' }}>Petrol / L</th>
                        <th style={{ padding: '10px 16px' }}>Diesel / L</th>
                        <th style={{ padding: '10px 16px' }}>CNG / Kg</th>
                        <th style={{ padding: '10px 16px' }}>Revision Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(fuelCities).map((cKey) => {
                        const item = fuelCities[cKey];
                        const isCurrent = selectedCity === cKey;
                        return (
                          <tr
                            key={cKey}
                            onClick={() => setSelectedCity(cKey)}
                            style={{
                              cursor: 'pointer',
                              backgroundColor: isCurrent ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
                              borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
                            }}
                          >
                            <td style={{ padding: '10px 16px', fontWeight: '900', color: isCurrent ? '#38bdf8' : '#ffffff' }}>
                              {item.city}
                            </td>
                            <td style={{ padding: '10px 16px', color: '#f87171', fontWeight: '800' }}>₹{item.petrol.toFixed(2)}</td>
                            <td style={{ padding: '10px 16px', color: '#38bdf8', fontWeight: '800' }}>₹{item.diesel.toFixed(2)}</td>
                            <td style={{ padding: '10px 16px', color: '#34d399', fontWeight: '800' }}>₹{item.cng.toFixed(2)}</td>
                            <td style={{ padding: '10px 16px', color: '#94a3b8', fontSize: '11px' }}>{item.status}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SMART CALCULATORS */}
          {activeTab === 'calculator' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {/* Gold Calculator */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(0, 0, 0, 0.3) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Coins size={18} color="#f59e0b" />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#ffffff' }}>
                    Gold Jewelry Cost Estimator
                  </h3>
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '800' }}>
                    SELECT PURITY (KARAT)
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['24', '22', '18'].map(k => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setCalcKarat(k)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          borderRadius: '8px',
                          border: calcKarat === k ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.1)',
                          background: calcKarat === k ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                          color: calcKarat === k ? '#f59e0b' : '#94a3b8',
                          fontWeight: '900',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        {k} Karat
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '800' }}>
                    WEIGHT IN GRAMS: <strong style={{ color: '#ffffff' }}>{calcGrams}g</strong>
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.5"
                    value={calcGrams}
                    onChange={e => setCalcGrams(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: '800'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '800' }}>
                    MAKING CHARGES (%): <strong style={{ color: '#ffffff' }}>{calcMakingPercent}%</strong>
                  </label>
                  <input
                    type="range"
                    min="3"
                    max="20"
                    value={calcMakingPercent}
                    onChange={e => setCalcMakingPercent(e.target.value)}
                    style={{ width: '100%', accentColor: '#f59e0b' }}
                  />
                </div>

                {/* Calculation breakdown */}
                <div style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                    <span>Raw Gold Price ({calcGrams}g):</span>
                    <span>₹{Math.round(baseGoldPrice).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                    <span>Making Charges ({calcMakingPercent}%):</span>
                    <span>₹{Math.round(makingCharges).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                    <span>GST (3%):</span>
                    <span>₹{Math.round(gstAmount).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: '8px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    fontWeight: '900',
                    fontSize: '15px',
                    color: '#f59e0b'
                  }}>
                    <span>Total Estimate:</span>
                    <span>₹{totalGoldPayable.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Fuel Trip Calculator */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(0, 0, 0, 0.3) 100%)',
                border: '1px solid rgba(14, 165, 233, 0.3)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Fuel size={18} color="#38bdf8" />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#ffffff' }}>
                    Gujarat Trip Fuel Cost Calculator
                  </h3>
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '800' }}>
                    SELECT FUEL
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[
                      { key: 'petrol', label: 'Petrol' },
                      { key: 'diesel', label: 'Diesel' },
                      { key: 'cng', label: 'CNG' }
                    ].map(f => (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setFuelType(f.key)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          borderRadius: '8px',
                          border: fuelType === f.key ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                          background: fuelType === f.key ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                          color: fuelType === f.key ? '#38bdf8' : '#94a3b8',
                          fontWeight: '900',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '800' }}>
                    TRIP DISTANCE (KM): <strong style={{ color: '#ffffff' }}>{tripDistanceKm} KM</strong>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={tripDistanceKm}
                    onChange={e => setTripDistanceKm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: '800'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: '800' }}>
                    VEHICLE MILEAGE (KM / LITER OR KG): <strong style={{ color: '#ffffff' }}>{vehicleMileage} KM/L</strong>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={vehicleMileage}
                    onChange={e => setVehicleMileage(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: '800'
                    }}
                  />
                </div>

                {/* Calculation breakdown */}
                <div style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                    <span>Fuel Required:</span>
                    <span>{fuelNeededLiters.toFixed(2)} {fuelType === 'cng' ? 'Kg' : 'Liters'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                    <span>Current Price Rate ({fuelCity}):</span>
                    <span>₹{currentFuelPricePerL.toFixed(2)}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: '8px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    fontWeight: '900',
                    fontSize: '15px',
                    color: '#38bdf8'
                  }}>
                    <span>Estimated Fuel Expense:</span>
                    <span>₹{totalTripFuelCost.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
